# RSO Dev Cloud Authentication Action

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

A GitHub Action that authenticates with RSO Developer Cloud and provides an
access token for other actions in your workflow.

## Description

This action authenticates with RSO Developer Cloud using service account
credentials, and sets an access token that can be used for subsequent API calls.
The token is made available both as an output and as an environment variable.

## Inputs

| Input                    | Description                                   | Required | Default                                                                                                                      |
| ------------------------ | --------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `api_url`                | The authentication API URL endpoint           | No       | [`https://auth.theorigamicorporation.com/application/o/token/`](https://auth.theorigamicorporation.com/application/o/token/) |
| `client_id`              | The client ID for authentication              | No       | FdPqdka22aPG9AnWuVMpFhsz7BGsgJCbxTCTkXrg                                                                                     |
| `service_account_name`   | The service account name for authentication   | Yes      | N/A                                                                                                                          |
| `service_account_secret` | The service account secret for authentication | Yes      | N/A                                                                                                                          |

## Outputs

| Output         | Description                     |
| -------------- | ------------------------------- |
| `access_token` | The authentication access token |

## Environment Variables

The action also sets the following environment variable that can be used in
subsequent steps:

- `RSO_DEV_ACCESS_TOKEN`: The authentication access token

## Usage

### Basic Example

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Authenticate with RSO Dev Cloud
        id: auth
        uses: theorigamicorporation/auth@v1
        with:
          service_account_name: ${{ secrets.RSO_SERVICE_ACCOUNT_NAME }}
          service_account_secret: ${{ secrets.RSO_SERVICE_ACCOUNT_SECRET }}

      - name: Use the token in a subsequent step
        env:
          RSO_TOKEN: ${{ steps.auth.outputs.access_token }}
        run: |
          curl --fail --silent --show-error \
            -H "Authorization: Bearer $RSO_TOKEN" \
            https://api.example.com/resource
```

The action masks the access token (and the service account secret) in the
workflow log. Pass the token through `env` rather than inlining
`${{ steps.auth.outputs.access_token }}` in a script, and never `echo` it.
`RSO_DEV_ACCESS_TOKEN` is also exported for every later step in the job.

### Custom API URL Example

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Authenticate with RSO Dev Cloud (Custom API)
        id: auth
        uses: theorigamicorporation/auth@v1
        with:
          api_url: https://custom-auth.example.com/token/
          client_id: custom-client-id
          service_account_name: ${{ secrets.RSO_SERVICE_ACCOUNT_NAME }}
          service_account_secret: ${{ secrets.RSO_SERVICE_ACCOUNT_SECRET }}
```

## Security

It's highly recommended to store sensitive information like service account
credentials using GitHub Secrets.

## License

This project is licensed under the MIT License - see the LICENSE file for
details.
