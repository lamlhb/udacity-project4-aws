import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

// import { getTodosForUser as getTodosForUser } from '../../businessLogic/todos'
import { getUserId } from '../utils';
// import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getToDoItems } from '../../helpers/todos'
import { createLogger } from '../../utils/logger'

const logger = createLogger('auth')

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here

    try {
      // TODO: Implement creating a new TODO item

      logger.error('Get Todos Start')
      const userId = getUserId(event);
      logger.error('userId --- ' + userId)

      const items = await getToDoItems(userId);

      logger.error('Get Todos End')
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          "items": items
        })
      }
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          "message": "Internal Error " + err.message
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
