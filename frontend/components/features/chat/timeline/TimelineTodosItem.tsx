"use client";

import type { TodosItem } from "@/hooks/use-timeline-reducer";
import { TodoList } from "@/components/prompt-kit/todo-list";

interface TimelineTodosItemProps {
  item: TodosItem;
}

export function TimelineTodosItem({ item }: TimelineTodosItemProps) {
  return <TodoList todos={item.todos} />;
}
