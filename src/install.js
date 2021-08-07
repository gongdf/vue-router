import View from './components/view'
import Link from './components/link'

export let _Vue

export function install (Vue) {
  // 通过install.installed标识插件只能install一次
  if (install.installed && _Vue === Vue) return
  install.installed = true

  _Vue = Vue

  const isDef = v => v !== undefined

  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }
  // 全局混入逻辑，混入在钩子函数中 - 钩子函数调用时router实例已经创建
  Vue.mixin({
    beforeCreate () {
      if (isDef(this.$options.router)) { // 根组件
        this._routerRoot = this
        this._router = this.$options.router
        this._router.init(this)
        // 转换为响应式数据
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      } else { // 其他的子孙组件
        // 在每个vm上挂载_routerRoot - 指向注入了router的根vm实例（new Vue注入时_routerRoot === $root）
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      // router-view中调用registerRouteInstance方法
      registerInstance(this, this)
    },
    destroyed () {
      registerInstance(this)
    }
  })
  // 挂载$router
  Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router }
  })
  // 挂载$route
  Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route }
  })
  // 注册全局组件
  Vue.component('RouterView', View)
  Vue.component('RouterLink', Link)

  const strats = Vue.config.optionMergeStrategies
  // 采用跟vue相同的选项合并策略
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}
