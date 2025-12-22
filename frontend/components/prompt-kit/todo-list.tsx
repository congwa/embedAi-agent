"use client"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { ChevronDown, Circle, CheckCircle2, Loader2, ListTodo } from "lucide-react"

export interface TodoItemData {
  content: string
  status: "pending" | "in_progress" | "completed"
}

export interface TodoListProps {
  todos: TodoItemData[]
  className?: string
  defaultOpen?: boolean
}

const STATUS_ICON_MAP = {
  pending: Circle,
  in_progress: Loader2,
  completed: CheckCircle2,
}

const STATUS_COLOR_MAP = {
  pending: "text-muted-foreground",
  in_progress: "text-blue-500",
  completed: "text-green-500",
}

const STATUS_LABEL_MAP = {
  pending: "待处理",
  in_progress: "进行中",
  completed: "已完成",
}

export function TodoList({ todos, className, defaultOpen = true }: TodoListProps) {
  if (!todos || todos.length === 0) {
    return null
  }

  const completedCount = todos.filter(t => t.status === "completed").length
  const inProgressCount = todos.filter(t => t.status === "in_progress").length
  const totalCount = todos.length

  return (
    <Collapsible defaultOpen={defaultOpen} className={cn("w-full", className)}>
      <CollapsibleTrigger className="group text-muted-foreground hover:text-foreground flex w-full cursor-pointer items-center justify-start gap-2 text-sm transition-colors">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex size-4 items-center justify-center">
            <ListTodo className="size-4" />
          </span>
          <span className="font-medium">
            任务规划
            <span className="ml-2 text-xs text-muted-foreground">
              ({completedCount}/{totalCount} 完成
              {inProgressCount > 0 && `, ${inProgressCount} 进行中`})
            </span>
          </span>
        </div>
        <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        <div className="mt-3 grid max-w-full min-w-0 grid-cols-[min-content_minmax(0,1fr)] items-start gap-x-3">
          <div className="min-w-0 self-stretch">
            <div className="bg-muted h-full w-[2px]" aria-hidden />
          </div>
          <div className="min-w-0 space-y-2">
            {todos.map((todo, index) => (
              <TodoItem key={index} todo={todo} />
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface TodoItemProps {
  todo: TodoItemData
}

function TodoItem({ todo }: TodoItemProps) {
  const Icon = STATUS_ICON_MAP[todo.status]
  const colorClass = STATUS_COLOR_MAP[todo.status]
  const isAnimated = todo.status === "in_progress"

  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon 
        className={cn(
          "size-4 mt-0.5 flex-shrink-0",
          colorClass,
          isAnimated && "animate-spin"
        )} 
      />
      <span className={cn(
        "flex-1",
        todo.status === "completed" && "line-through text-muted-foreground"
      )}>
        {todo.content}
      </span>
      <span className={cn(
        "text-xs px-1.5 py-0.5 rounded-full flex-shrink-0",
        todo.status === "pending" && "bg-muted text-muted-foreground",
        todo.status === "in_progress" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        todo.status === "completed" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      )}>
        {STATUS_LABEL_MAP[todo.status]}
      </span>
    </div>
  )
}

export default TodoList
