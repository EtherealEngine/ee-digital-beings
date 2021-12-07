import type { ProjectConfigInterface } from '@xrengine/projects/ProjectConfigInterface'

const config: ProjectConfigInterface = {
  thumbnail: "https://imgur.com/Spyv0Fv.png",
  routes: {
    '/': {
      component: () => import('./pages/index'),
      props: {
        exact: true
      }
    }
  },
  services: undefined,
  databaseSeed: undefined,
}

export default config