// import todoAccess from './todoAccess';
import { attachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as uuid from 'uuid'
import { todoAccess } from './todosAccess'

// TODO: Implement businessLogic
const todosAccess = new todoAccess();
const todosStorage = new attachmentUtils();

export async function getToDoItems(userId: string): Promise<TodoItem[]> {
  return await todosAccess.getToDoItems(userId);
}

export async function createToDoItem(userId: string, createTodo: CreateTodoRequest): Promise<TodoItem> {
  let todoId = uuid.v4;

  const newItem: TodoItem = {
    userId,
    todoId: todoId,
    done: false,
    // attachmentUrl: null,
    createdAt: new Date().toISOString(),
    name: createTodo.name,
    dueDate: createTodo.dueDate
  };

  await todosAccess.createToDoItem(newItem);

  return newItem;

}

export async function updateToDoItem(todoId: string, userId: string, item: UpdateTodoRequest) {

  const currentItem = await todosAccess.getToDoItem(todoId);

  checkPermission(userId, currentItem);

  currentItem.name = item.name;
  currentItem.done = item.done;
  currentItem.dueDate = item.dueDate;

  await todosAccess.updateToDoItem(todoId, currentItem);
}

export async function deleteToDoItem(userId: string, todoId: string) {
  const currentItem = await todosAccess.getToDoItem(todoId)

  checkPermission(userId, currentItem);

  await todosAccess.deleteToDoItem(todoId);
}

export async function updateAttachmentUrl(todoId: string, userId: string, attachmentId: string) {

  const attachmentUrl = await todosStorage.getAttachmentUrl(attachmentId);

  const currentItem = await todosAccess.getToDoItem(todoId)

  checkPermission(userId, currentItem);

  await todosAccess.updateAttachmentUrl(todoId, userId, attachmentUrl)
}

export async function getSignedUploadUrl(attachmentId: string): Promise<string> {
  return await todosStorage.getUploadUrlToS3(attachmentId);
}

function checkPermission(currentUser: string, toDoItem: TodoItem) {
  if (!toDoItem)
    throw new Error('Item not found');

  if (toDoItem.userId !== currentUser) {
    throw new Error('User is not authorized to action in this item');
  }
}