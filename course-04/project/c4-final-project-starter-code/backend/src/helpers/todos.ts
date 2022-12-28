// import todoAccess from './todoAccess';
import { attachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as uuid from 'uuid'
import { todoAccess } from './todosAccess'
import { createLogger } from '../utils/logger'

const logger = createLogger('todo')

// TODO: Implement businessLogic
const todosAccess = new todoAccess();
const todosStorage = new attachmentUtils();

export async function getToDoItems(userId: string): Promise<TodoItem[]> {
  return await todosAccess.getToDoItems(userId);
}

export async function createToDoItem(userId: string, createTodo: CreateTodoRequest): Promise<TodoItem> {
  // let todoId = uuid.v4;
  logger.debug('user ' + userId + ' create a new item')
  const newItem: TodoItem = {
    userId,
    todoId: uuid.v4(),
    done: false,
    // attachmentUrl: null,
    createdAt: new Date().toISOString(),
    name: createTodo.name,
    dueDate: createTodo.dueDate
  };

  logger.debug('newItemId: ' + newItem.todoId)

  await todosAccess.createToDoItem(newItem);

  return newItem;

}

export async function updateToDoItem(todoId: string, userId: string, item: UpdateTodoRequest) {

  const currentItem = await todosAccess.getToDoItem(todoId, userId);

  checkPermission(userId, currentItem);

  currentItem.name = item.name;
  currentItem.done = item.done;
  currentItem.dueDate = item.dueDate;

  await todosAccess.updateToDoItem(todoId, userId, currentItem);
}

export async function deleteToDoItem(userId: string, todoId: string) {
  const currentItem = await todosAccess.getToDoItem(todoId, userId)

  checkPermission(userId, currentItem);

  await todosAccess.deleteToDoItem(todoId, userId);
}

export async function updateAttachmentUrl(todoId: string, userId: string, attachmentId: string) {

  const attachmentUrl = await todosStorage.getAttachmentUrl(attachmentId);

  const currentItem = await todosAccess.getToDoItem(todoId, userId)

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