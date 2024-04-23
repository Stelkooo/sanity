import {EarthAmericasIcon} from '@sanity/icons'
import {Box} from '@sanity/ui'

import {Button, Tooltip} from '../../../../ui-components'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import useDialogTimeZone from '../../hooks/useDialogTimeZone'
import useTimeZone from '../../hooks/useTimeZone'
import {scheduledPublishingNamespace} from '../../i18n'

export interface ButtonTimeZoneProps {
  useElementQueries?: boolean
}

const ButtonTimeZone = (props: ButtonTimeZoneProps) => {
  const {useElementQueries} = props
  const {t} = useTranslation(scheduledPublishingNamespace)
  const {timeZone} = useTimeZone()
  const {DialogTimeZone, dialogProps, dialogTimeZoneShow} = useDialogTimeZone()

  return (
    <>
      {/* Dialog */}
      {DialogTimeZone && <DialogTimeZone {...dialogProps} />}

      <Tooltip
        content={t('time-zone-button.tooltip', {
          alternativeName: timeZone.alternativeName,
          offset: timeZone.offset,
        })}
        portal
      >
        <div>
          {/*
          If `useElementQueries` is enabled, dates will be conditionally toggled at different element
          breakpoints - provided this `<ButtonTimeZone>` is wrapped in a `<ButtonTimeZoneElementQuery>` component.
        */}
          {useElementQueries ? (
            <>
              <Box className="button-small">
                <Button
                  icon={EarthAmericasIcon}
                  mode="bleed"
                  onClick={dialogTimeZoneShow}
                  text={`${timeZone.abbreviation}`}
                />
              </Box>
              <Box className="button-large">
                <Button
                  icon={EarthAmericasIcon}
                  mode="bleed"
                  onClick={dialogTimeZoneShow}
                  text={`${timeZone.alternativeName} (${timeZone.namePretty})`}
                />
              </Box>
            </>
          ) : (
            <Button
              icon={EarthAmericasIcon}
              mode="bleed"
              onClick={dialogTimeZoneShow}
              text={`${timeZone.alternativeName} (${timeZone.namePretty})`}
            />
          )}
        </div>
      </Tooltip>
    </>
  )
}

export default ButtonTimeZone
