import * as core from '@actions/core'
import axios from 'axios'
import * as querystring from 'querystring'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Get the inputs from the workflow file
    const apiUrl: string = core.getInput('api_url', { required: true })
    const clientId: string = core.getInput('client_id', { required: true })
    const serviceAccountName: string = core.getInput('service_account_name', {
      required: true
    })
    const serviceAccountSecret: string = core.getInput(
      'service_account_secret',
      { required: true }
    )

    core.debug(`Authenticating with RSO Developer Cloud at ${apiUrl}`)

    // Create the form data for the authentication request
    const formData = querystring.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      username: serviceAccountName,
      password: serviceAccountSecret,
      scope: 'profile'
    })

    // Make the authentication request
    const response = await axios.post(apiUrl, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    // Extract the access token from the response
    const accessToken = response.data.access_token

    if (!accessToken) {
      throw new Error('No access token received in response')
    }

    // Set the access token as an output
    core.setOutput('access_token', accessToken)

    // Export the token as an environment variable
    core.exportVariable('RSO_DEV_ACCESS_TOKEN', accessToken)

    core.info('Successfully authenticated with RSO Developer Cloud')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(`Authentication failed: ${error.message}`)
    } else {
      core.setFailed('Authentication failed with an unknown error')
    }
  }
}
