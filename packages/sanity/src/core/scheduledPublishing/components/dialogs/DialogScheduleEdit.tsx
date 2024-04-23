import {useCallback} from 'react'

import {Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import useScheduleForm from '../../hooks/useScheduleForm'
import useScheduleOperation from '../../hooks/useScheduleOperation'
import {scheduledPublishingNamespace} from '../../i18n'
import {type Schedule} from '../../types'
import {EditScheduleForm} from '../editScheduleForm/EditScheduleForm'
import DialogHeader from './DialogHeader'

export interface DialogScheduleEditProps {
  onClose: () => void
  schedule: Schedule
}

const DialogScheduleEdit = (props: DialogScheduleEditProps) => {
  const {t} = useTranslation(scheduledPublishingNamespace)
  const {onClose, schedule} = props

  const {updateSchedule} = useScheduleOperation()
  const {formData, isDirty, onFormChange} = useScheduleForm(schedule)

  // Callbacks
  const handleScheduleUpdate = useCallback(() => {
    if (!formData?.date) {
      return
    }
    // Update schedule then close self
    updateSchedule({
      date: formData.date,
      scheduleId: schedule.id,
    }).then(onClose)
  }, [schedule.id, updateSchedule, onClose, formData?.date])

  return (
    <Dialog
      footer={{
        confirmButton: {
          text: t('dialog.scheduled-edit.confirm'),
          disabled: !isDirty,
          onClick: handleScheduleUpdate,
        },
      }}
      header={<DialogHeader title="Edit schedule" />}
      id="time-zone"
      onClose={onClose}
      width={1}
    >
      <EditScheduleForm onChange={onFormChange} value={formData} />
    </Dialog>
  )
}

export default DialogScheduleEdit
