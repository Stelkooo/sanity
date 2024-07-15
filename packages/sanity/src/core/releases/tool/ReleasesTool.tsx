import {useRouter} from 'sanity/router'

import {ReleaseDetail} from './detail/ReleaseDetail'
import {ReleasesOverview} from './overview/ReleasesOverview'

export function ReleasesTool() {
  const router = useRouter()

  const {bundleName} = router.state

  if (bundleName) return <ReleaseDetail />

  return <ReleasesOverview />
}
