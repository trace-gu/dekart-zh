import common from './common'
import home from './home'
import report from './report'
import serverErrors from './serverErrors'
import widgets from './widgets'
import workspace from './workspace'

// Each area keeps its own source-string dictionary so translations stay close to the pages using them.
export default {
  ...common,
  ...serverErrors,
  ...home,
  ...report,
  ...widgets,
  ...workspace
}
