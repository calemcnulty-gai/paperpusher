import { createClient } from 'npm:@supabase/supabase-js'
import { Action, AgentResponse, UserProfile, CreateTaskPayload, UpdateTaskPayload } from '../../shared/types.ts'
import { getSupabaseClient } from '../config/supabase.ts'

export interface TaskExecutor {
  execute(action: Action, userProfile: UserProfile): Promise<AgentResponse>
}

class TaskExecutorImpl implements TaskExecutor {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    this.supabase = getSupabaseClient()
  }

  private isCreateTaskPayload(payload: any): payload is CreateTaskPayload {
    return payload && 'title' in payload
  }

  private isUpdateTaskPayload(payload: any): payload is UpdateTaskPayload {
    return payload && 'id' in payload && 'status' in payload
  }

  async execute(action: Action, userProfile: UserProfile): Promise<AgentResponse> {
    switch (action.type) {
      case 'CREATE_TASK':
        return this.createTask(action, userProfile)
      case 'UPDATE_TASK':
        return this.updateTask(action, userProfile)
      default:
        throw new Error(`TaskExecutor cannot handle action type: ${action.type}`)
    }
  }

  private async createTask(action: Action, userProfile: UserProfile): Promise<AgentResponse> {
    if (!this.isCreateTaskPayload(action.payload)) {
      throw new Error('Invalid payload for CREATE_TASK')
    }

    console.log('📝 Creating task', action.payload)
    const { data, error } = await this.supabase
      .from('tasks')
      .insert([{
        ...action.payload,
        creator_id: userProfile.id,
        assignee_id: action.payload.assignee_id || userProfile.id,
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Task creation failed', error)
      throw error
    }

    console.log('✅ Task created successfully', { taskId: data.id })
    return {
      message: `Task "${data.title}" created successfully.`,
      action: {
        type: 'CREATE_TASK',
        status: 'success',
        data,
        links: {
          task: `/tasks/${data.id}`
        }
      }
    }
  }

  private async updateTask(action: Action, userProfile: UserProfile): Promise<AgentResponse> {
    if (!this.isUpdateTaskPayload(action.payload)) {
      throw new Error('Invalid payload for UPDATE_TASK')
    }

    console.log('🔄 Updating task', {
      taskId: action.payload.id,
      newStatus: action.payload.status
    })

    const { data, error } = await this.supabase
      .from('tasks')
      .update({
        status: action.payload.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', action.payload.id)
      .select()
      .single()

    if (error) {
      console.error('❌ Task update failed', error)
      throw error
    }

    console.log('✅ Task updated successfully', {
      taskId: data.id,
      newStatus: data.status
    })

    return {
      message: `Task status updated to "${data.status}".`,
      action: {
        type: 'UPDATE_TASK',
        status: 'success',
        data,
        links: {
          task: `/tasks/${data.id}`
        }
      }
    }
  }
}

export async function createTaskExecutor(): Promise<TaskExecutor> {
  return new TaskExecutorImpl()
} 