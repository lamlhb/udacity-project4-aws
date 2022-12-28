import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export class todoAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly toDoTable: string = process.env.TODOS_TABLE
  ) {}

  async getToDoItems(userId: string): Promise<TodoItem[]> {
    logger.error('table name --- ' + this.toDoTable)
    const queryResult = await this.docClient.query({
      TableName: this.toDoTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise();
    const toDoItems = queryResult.Items;
    return toDoItems as TodoItem[];
  }

  async getToDoItem(todoId: string, userId: string): Promise<TodoItem> {
    const result = await this.docClient.get({
      TableName: this.toDoTable,
      Key: {
        todoId: todoId,
        userId: userId
      }
    }).promise()
    const toDoItem = result.Item;
    return toDoItem as TodoItem;
  }

  async createToDoItem(todoItem: TodoItem) {
    logger.error('todoId: ' + todoItem.todoId)
    await this.docClient.put({
      TableName: this.toDoTable,
      Item: todoItem
    }).promise();
  }

  async deleteToDoItem(todoId: string, userId: string) {
    await this.docClient.delete({
      TableName: this.toDoTable,
      Key: {
        todoId: todoId,
        userId: userId
      }
    }).promise();
  }

  async updateToDoItem(todoId: string, userId: string, toDoItem: TodoUpdate) {
    await this.docClient.update({
      TableName: this.toDoTable,
      Key: {
        todoId,
        userId
      },
      UpdateExpression: 'set name = :name, dueDate = :dueDate, done = :done',
      ExpressionAttributeValues: {
        ":name": toDoItem.name,
        ":dueDate": toDoItem.dueDate,
        ":done": toDoItem.done
      }
    }).promise()
  }

  async updateAttachmentUrl(todoId: string, userId: string, attachmentUrl: string) {

    await this.docClient.update({
      TableName: this.toDoTable,
      Key: {
        todoId,
        userId
      },
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': attachmentUrl
      }
    }).promise()
  }

}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    logger.info('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}