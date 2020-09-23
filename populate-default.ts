import { bootstrap, defaultConfig, mergeConfig, UuidIdStrategy } from '@vendure/core'
import { populate } from '@vendure/core/cli'
import { clearAllTables, populateCustomers } from '@vendure/testing'
import { config } from './src/vendure-config'
import path from 'path'
import { AdminUiPlugin } from '@vendure/admin-ui-plugin'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const initialData = require('@vendure/create/assets/initial-data.json')

// tslint:disable:no-console

/**
 * A CLI script which populates the database with some sample data
 */
if (require.main === module) {
  // Running from command line
  const populateConfig = mergeConfig(
    defaultConfig,
    mergeConfig(config, {
      entityIdStrategy: new UuidIdStrategy(),
      authOptions: {
        tokenMethod: 'bearer',
        requireVerification: false,
      },
      importExportOptions: {
        importAssetsDir: resolveFromCreatePackage('assets/images'),
      },
      workerOptions: {
        runInMainProcess: true,
      },
      customFields: {},
      plugins: config.plugins!.filter(plugin => plugin !== AdminUiPlugin),
      dbConnectionOptions: {
        database: 'vendure',
        synchronize: false,
        logging: true,
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: +(process.env.DB_PORT || 3306),
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || 'root',
      }
    }),
  )
  clearAllTables(populateConfig, true)
    .then(() =>
      populate(
        () => bootstrap(populateConfig),
        initialData,
        resolveFromCreatePackage('assets/products.csv'),
      ),
    )
    .then(async app => {
      console.log('populating customers...')
      await populateCustomers(10, populateConfig, true)
      return app.close()
    })
    .then(
      () => process.exit(0),
      err => {
        console.log(err)
        process.exit(1)
      },
    )
}

function resolveFromCreatePackage(target: string): string {
  return path.join(path.dirname(require.resolve('@vendure/create')), target)
}
