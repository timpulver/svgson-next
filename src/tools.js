import omitDeep from 'omit-deep'
import rename from 'deep-rename-keys'
import clean from 'clean-deep'
import svgo from 'svgo'
import { parseSync } from 'xml-reader'

export const svgoDefaultConfig = {
  plugins: [
    { removeStyleElement: true },
    { removeViewBox: false },
    {
      removeAttrs: {
        attrs: '(stroke-width|stroke-linecap|stroke-linejoin|)',
      },
    },
  ],
  multipass: true,
}

export const parseInput = input => {
  const parsed = parseSync(input, { parentNodes: false })
  const hasMoreChildren = parsed.name === 'root' && parsed.children.length > 1
  const isValid = hasMoreChildren
    ? parsed.children.reduce((acc, { name }) => {
        return !acc ? name === 'svg' : true
      }, false)
    : parsed.children[0].name === 'svg'

  return new Promise((resolve, reject) => {
    if (isValid) {
      resolve(hasMoreChildren ? parsed : parsed.children[0])
    } else {
      reject('nothing to parse')
    }
  })
}

export const removeDoctype = input => {
  return input.replace(/<[\/]{0,1}(\!?DOCTYPE|\??xml)[^><]*>/gi, '')
}
export const wrapInput = input => Promise.resolve(`<root>${input}</root>`)

export const optimizeSVG = (input, config) => {
  return new svgo(config).optimize(input).then(({ data }) => data)
}

export const removeAttrs = obj => omitDeep(obj, ['value', 'parent'])
export const wrapInKey = (key, node) => ({ [key]: node })
export const addCustomAttrs = (attrs, node) => ({
  ...node,
  ...attrs,
})

export const compat = node => {
  const renamed = rename(node, key => {
    if (key === 'attributes') {
      return 'attrs'
    }
    if (key === 'children') {
      return 'childs'
    }
    return key
  })
  return omitDeep(clean(renamed), ['type'])
}

export const camelize = node => {
  return rename(node, key => {
    if (!notCamelcase(key)) {
      return toCamelCase(key)
    }
    return key
  })
}

export const toCamelCase = prop =>
  prop.replace(/[-|:]([a-z])/gi, (all, letter) => letter.toUpperCase())

const notCamelcase = prop => /^(data|aria)(-\w+)/.test(prop)
