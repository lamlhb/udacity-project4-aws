import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createToDoItem } from '../../helpers/todos'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    try {
      const newTodo: CreateTodoRequest = JSON.parse(event.body)
      // TODO: Implement creating a new TODO item
      const userId = getUserId(event);

      const createdTodoItem = await createToDoItem(userId, newTodo);

      return {
        statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          "item": createdTodoItem
        })
      }
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          "message": "Internal Error" + err.message
        })
      }
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
