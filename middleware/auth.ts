export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    if (to.path === "/dashboard") return navigateTo("/login")
    return
  }

  const { init, isAuthenticated } = useAuth()
  await init()

  if (!isAuthenticated.value && to.path === "/dashboard") {
    return navigateTo("/login")
  }

  if (isAuthenticated.value && to.path === "/login") {
    return navigateTo("/dashboard")
  }
})
