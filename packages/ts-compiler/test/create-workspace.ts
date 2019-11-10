import { getCapsuleName } from '../src/utils'
import { promises as fs } from 'fs'
import mkdirp, { Options } from 'mkdirp'
import path from 'path'

export async function createWorkspace(content: WorkspaceContent, options:WorkspaceOptions): Promise<string> {
    const targetDir = getCapsuleName('space')
    enrichContentWithDefaults(content, options)

    await createFS(targetDir, content)
    await runActions(targetDir, options.actions || [])

    return targetDir
}

export type Action = {
    command:string, 
    args:string[]
}
export interface WorkspaceOptions {
    env: string, 
    name: string,
    packageJSON?:{[k:string]:any},
    actions?: Action[]
}

export interface WorkspaceContent {
    [k: string]: string 
}

function mkdirPromise(dir: string, opts: Options) {
    return new Promise((resolve, reject) => {
        mkdirp(dir, opts, (err, made) => err === null ? resolve(made) : reject(err))
    })
}

async function createFS(targetDir:string, content: WorkspaceContent){
    await mkdirPromise(targetDir, {})
    await Object.keys(content).map(async key => {
        const realPath = path.join(targetDir, key)
        const containingFolder = path.dirname(realPath)
        await mkdirPromise(containingFolder, {})
        const filePath = path.resolve(targetDir, key)
        await fs.writeFile(filePath, content[key])
    })
}

function enrichContentWithDefaults(content: WorkspaceContent, options: WorkspaceOptions) {
    const packageJSON = Object.assign({
        name: options.name,
        description: `Testing ${options.name}`,
        version: "0.0.1",
        bit: {
            env: {
              compiler: {
                  meta: {
                      options: {
                          file: path.resolve(options.env)
                      }
                  }
              }
            },
            componentsDefaultDirectory: 'components/{name}',
            packageManager: 'npm'
          }
    }, options.packageJSON || {})
    
    content['package.json'] = content['package.json'] || JSON.stringify(packageJSON, null, 4)
    content['.bitmap'] = content['.bitmap'] || `/* THIS IS A BIT-AUTO-GENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY. */
    
    ${JSON.stringify({"version": "14.3.0"}, null, 4)}`
    content['.gitignore'] =  content['.gitignore'] || `dist\nnode_modules\n`
}

async function runActions(directory:string, actions:Action[]) {
    const cwd = process.cwd()
    process.chdir(directory)
    const allActions = await Promise.all(actions.map((action)=> {
        return runAction(action)
    }))
    process.chdir(cwd)
    return allActions
}

function runAction(action:Action) {
    console.log(`command: ${action.command} ${action.args.join('')}`)
}