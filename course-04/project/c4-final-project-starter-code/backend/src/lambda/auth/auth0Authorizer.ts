import { APIGatewayTokenAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-uc8gx3yiacbxgp12.us.auth0.com/.well-known/jwks.json';

// const defaultCert = '-----BEGIN CERTIFICATE-----\n' +
//   'MIIDHTCCAgWgAwIBAgIJKy2PA/mZxSLOMA0GCSqGSIb3DQEBCwUAMCwxKjAoBgNV\n' +
//   'BAMTIWRldi11YzhneDN5aWFjYnhncDEyLnVzLmF1dGgwLmNvbTAeFw0yMjEyMjcw\n' +
//   'OTM2MDlaFw0zNjA5MDQwOTM2MDlaMCwxKjAoBgNVBAMTIWRldi11YzhneDN5aWFj\n' +
//   'YnhncDEyLnVzLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC\n' +
//   'ggEBAM/QDvmStphtE1zl6NtkElmlDbX8VhHHhUf5i2T4NHvOLKzPXP/x2l78UPdJ\n' +
//   'RJFMAK68wfeEeYa7xIdV5pmQsoIkx2VvyWmTsmAXEoCSSlwfuqoMuGcni8HLsO4l\n' +
//   'zsRjhgexQpiXa1jEjdzaigesSxapUvyziBx7KBzWsT5YdjSi838b7SddwaRYjWjN\n' +
//   'iNWsk+uwSWyY3faFj8JV9dDMdB9arNF1cIZSEt55BercS1VS+NAlT5mS9Gu6dCOW\n' +
//   'wA4PGkvh9k4yAvQiszzmI6fnsAm8yI2gny94kkfo9QVA9++FWHtng87MYQuNEYy4\n' +
//   '/vQBnq5gkyoUFaheegeSdVCCfVkCAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAd\n' +
//   'BgNVHQ4EFgQU1OFv9ApzfNuFSz4VNz0MCZC0ItEwDgYDVR0PAQH/BAQDAgKEMA0G\n' +
//   'CSqGSIb3DQEBCwUAA4IBAQBNplFA7SpBWQNbiPtrMxDEfvOUr6k93d22FICnEYVw\n' +
//   'CUK7i3VsY9SMJbheu7axcT0iI6yQlXxRZQ4AmimOdkiFZ03zbvl0aOZOu+KrG/sj\n' +
//   'x0AyXsgOuBLPe0QthGFYiFhl1n9o+K8NrxnhT7+Cy652Dg2+PNDVwj7Ps+LXnhod\n' +
//   'oXt1V4zdwVY15WM1aabLTnSKUjgR40wJX+zJk3ZAl+iZyJtt88n+qjr68t/u3dK4\n' +
//   'QMb28CZUPDBk2m+Kr3VMFWT2MtZ0jEMw7KYwEE/oyACuoJuQR9DRsrxkMr4UUNe7\n' +
//   'YBvuLYZvTycFm6dteMQc5WkY1kQ+4z1W/lFCK789Y2lK\n' +
//   '-----END CERTIFICATE-----'

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.toString() })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  logger.error('jwt --- ' + jwt)
  logger.error('jwt.kid --- ' + jwt.header.kid)
  let signKey = await getKey(jwksUrl, jwt.header.kid);

  logger.error('sign-key-kid --- ' + signKey.kid)
  logger.error('sign-key-str --- ' + signKey.nbf)
  logger.error('sign-key-publicKey --- ' + signKey.publicKey)

  const publicKey = convertCertToPem(signKey.publicKey)

  logger.error('sign-key --- ' + publicKey)

  return verify (token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
}

function getToken(authHeader: string): string {
  logger.error('authHeader --- ' + authHeader)
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]
  logger.error('token --- ' + token)

  return token
}

const getKey = async (jwksUrl, kid) => {

  // Get list of keys from provided jwksUrl
    let res = await Axios.get(jwksUrl, {
      headers: {
        'Content-Type': 'application/json',
        "Access-Control-Allow-Origin": "*",
        'Access-Control-Allow-Credentials': true,
        "Accept-Encoding": "gzip,deflate,compress",
      }
    });

    logger.error('res.data --- ' + res.data)
    let keys  = res.data.keys;

    // filter in list of response keys to find the signing key
    const signingKeys = keys.filter(key => key.use === 'sig' // determines the key is signing key
      && key.kty === 'RSA' // supporting for RSA
      && key.kid && key.kid === kid// using to compare with kid in jwt
      && key.x5c && key.x5c.length
    ).map(key => {
      logger.error('key.x5c0 --- ' + key.x5c[0])
      return { kid: key.kid, nbf: key.nbf, publicKey: key.x5c[0] };
    });

    const signKey = signingKeys.filter(key => key.kid === kid)?.[0];

    if (!signKey) {
      throw new Error('Unauthorized');
    }

    return signKey;


}

function convertCertToPem(cert: string) {
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;

  logger.error('cert --- ' + cert)

  return cert;
}

