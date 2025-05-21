/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import type { AxiosResponse } from 'axios'

// Mock axios
const mockAxiosPost = jest.fn<() => Promise<AxiosResponse>>()
jest.unstable_mockModule('axios', () => ({
  default: {
    post: mockAxiosPost
  }
}))

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

describe('main.ts', () => {
  // Mock inputs
  const mockInputs: Record<string, string> = {
    api_url: 'https://api.example.com/token',
    client_id: 'test-client-id',
    service_account_name: 'test-service-account',
    service_account_secret: 'test-secret'
  }

  // Mock successful API response
  const mockTokenResponse: AxiosResponse = {
    data: {
      access_token: 'mock-access-token',
      token_type: 'Bearer',
      expires_in: 3600
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: {} as any
  }

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks()

    // Set the action's inputs as return values from core.getInput()
    core.getInput.mockImplementation((name, options) => {
      if (mockInputs[name]) {
        return mockInputs[name]
      }
      if (options?.required) {
        throw new Error(`Input required and not supplied: ${name}`)
      }
      return ''
    })

    // Setup successful response by default
    mockAxiosPost.mockResolvedValue(mockTokenResponse)
  })

  it('authenticates successfully and sets the access token', async () => {
    // Run the action
    await run()

    // Verify axios was called correctly
    expect(mockAxiosPost).toHaveBeenCalledWith(
      mockInputs.api_url,
      expect.stringContaining(`grant_type=client_credentials`),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
    )

    // Verify the access token was set as output
    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'access_token',
      'mock-access-token'
    )

    // Verify the token was exported as environment variable
    expect(core.exportVariable).toHaveBeenNthCalledWith(
      1,
      'RSO_DEV_ACCESS_TOKEN',
      'mock-access-token'
    )

    // Verify success message was logged
    expect(core.info).toHaveBeenCalledWith(
      'Successfully authenticated with RSO Developer Cloud'
    )
  })

  it('handles API errors appropriately', async () => {
    // Mock API error
    const errorMessage = 'Invalid client credentials'
    mockAxiosPost.mockRejectedValue(new Error(errorMessage))

    // Run the action
    await run()

    // Verify the action was marked as failed with correct error message
    expect(core.setFailed).toHaveBeenNthCalledWith(
      1,
      `Authentication failed: ${errorMessage}`
    )
  })

  it('handles missing access token in response', async () => {
    // Mock response without access token
    mockAxiosPost.mockResolvedValue({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: {} as any
    })

    // Run the action
    await run()

    // Verify the action was marked as failed
    expect(core.setFailed).toHaveBeenNthCalledWith(
      1,
      'Authentication failed: No access token received in response'
    )
  })

  it('handles unknown errors', async () => {
    // Mock a non-Error rejection
    mockAxiosPost.mockRejectedValue('Unknown error')

    // Run the action
    await run()

    // Verify the action was marked as failed with generic message
    expect(core.setFailed).toHaveBeenNthCalledWith(
      1,
      'Authentication failed with an unknown error'
    )
  })
})
