import {useState} from 'react';
import {css, useTheme} from '@emotion/react';
import styled from '@emotion/styled';

import {LinkButton} from 'sentry/components/button';
import ButtonBar from 'sentry/components/buttonBar';
import {
  GridBodyCell,
  GridHead,
  GridHeadCell,
  GridResizer,
} from 'sentry/components/gridEditable/styles';
import Panel from 'sentry/components/panels/panel';
import {IconChevron} from 'sentry/icons';
import {t, tct} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import {type Group, IssueType} from 'sentry/types/group';
import type {Project} from 'sentry/types/project';
import {parseCursor} from 'sentry/utils/cursor';
import parseLinkHeader from 'sentry/utils/parseLinkHeader';
import {useLocation} from 'sentry/utils/useLocation';
import useOrganization from 'sentry/utils/useOrganization';
import {useRoutes} from 'sentry/utils/useRoutes';
import {useEventColumns} from 'sentry/views/issueDetails/allEventsTable';
import {ALL_EVENTS_EXCLUDED_TAGS} from 'sentry/views/issueDetails/groupEvents';
import {useIssueDetailsEventView} from 'sentry/views/issueDetails/streamline/useIssueDetailsDiscoverQuery';
import {useGroupDetailsRoute} from 'sentry/views/issueDetails/useGroupDetailsRoute';
import EventsTable from 'sentry/views/performance/transactionSummary/transactionEvents/eventsTable';

interface EventListProps {
  group: Group;
  project: Project;
}

export function EventList({group}: EventListProps) {
  const referrer = 'issue_details.streamline_list';
  const theme = useTheme();
  const location = useLocation();
  const organization = useOrganization();
  const routes = useRoutes();
  const [_error, setError] = useState('');
  const {fields, columnTitles} = useEventColumns(group, organization);
  const eventView = useIssueDetailsEventView({group, queryProps: {fields}});
  const {baseUrl} = useGroupDetailsRoute();

  const grayText = css`
    color: ${theme.subText};
    font-weight: ${theme.fontWeightNormal};
  `;

  const isRegressionIssue =
    group.issueType === IssueType.PERFORMANCE_DURATION_REGRESSION ||
    group.issueType === IssueType.PERFORMANCE_ENDPOINT_REGRESSION;

  return (
    <StreamlineEventsTable>
      <EventsTable
        eventView={eventView}
        location={location}
        issueId={group.id}
        isRegressionIssue={isRegressionIssue}
        organization={organization}
        routes={routes}
        excludedTags={ALL_EVENTS_EXCLUDED_TAGS}
        projectSlug={group.project.slug}
        customColumns={['minidump']}
        setError={err => setError(err ?? '')}
        transactionName={group.title || group.type}
        columnTitles={columnTitles}
        referrer={referrer}
        hidePagination
        renderTableHeader={({
          pageLinks,
          pageEventsCount,
          totalEventsCount,
          isPending,
        }) => {
          const links = parseLinkHeader(pageLinks);
          const previousDisabled = links.previous?.results === false;
          const nextDisabled = links.next?.results === false;
          const currentCursor = parseCursor(location.query?.cursor);
          const start = currentCursor?.offset ?? 0;

          return (
            <EventListHeader>
              <EventListTitle>{t('All Events')}</EventListTitle>
              <EventListHeaderItem>
                {isPending
                  ? null
                  : tct('Showing [start]-[end] of [count]', {
                      start: start,
                      end: start + pageEventsCount,
                      count: totalEventsCount,
                    })}
              </EventListHeaderItem>
              <EventListHeaderItem>
                <ButtonBar gap={0.25}>
                  <LinkButton
                    aria-label={t('Previous Page')}
                    borderless
                    size="xs"
                    icon={<IconChevron direction="left" />}
                    css={grayText}
                    to={{
                      ...location,
                      query: {
                        ...location.query,
                        cursor: links.previous?.cursor,
                      },
                    }}
                    disabled={isPending || previousDisabled}
                  />
                  <LinkButton
                    aria-label={t('Next Page')}
                    borderless
                    size="xs"
                    icon={<IconChevron direction="right" />}
                    css={grayText}
                    to={{
                      ...location,
                      query: {
                        ...location.query,
                        cursor: links.next?.cursor,
                      },
                    }}
                    disabled={isPending || nextDisabled}
                  />
                </ButtonBar>
              </EventListHeaderItem>

              <EventListHeaderItem>
                <LinkButton
                  borderless
                  size="xs"
                  css={grayText}
                  to={{
                    pathname: baseUrl,
                    query: location.query,
                  }}
                >
                  {t('Close')}
                </LinkButton>
              </EventListHeaderItem>
            </EventListHeader>
          );
        }}
      />
    </StreamlineEventsTable>
  );
}

const EventListHeader = styled('div')`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: ${space(1.5)};
  align-items: center;
  padding: ${space(0.75)} ${space(2)};
  background: ${p => p.theme.background};
  border-bottom: 1px solid ${p => p.theme.translucentBorder};
  position: sticky;
  top: 0;
  z-index: 500;
  border-radius: ${p => p.theme.borderRadiusTop};
`;

const EventListTitle = styled('div')`
  color: ${p => p.theme.textColor};
  font-weight: ${p => p.theme.fontWeightBold};
  font-size: ${p => p.theme.fontSizeLarge};
`;

const EventListHeaderItem = styled('div')`
  color: ${p => p.theme.subText};
  font-weight: ${p => p.theme.fontWeightNormal};
  font-size: ${p => p.theme.fontSizeSmall};
`;

const StreamlineEventsTable = styled('div')`
  ${Panel} {
    border: 0;
  }

  ${GridHead} {
    min-height: unset;
    font-size: ${p => p.theme.fontSizeMedium};
    ${GridResizer} {
      height: 36px;
    }
  }

  ${GridHeadCell} {
    height: 36px;
    padding: 0 ${space(1.5)};
    white-space: nowrap;
    text-overflow: ellipsis;
    text-transform: capitalize;
    border-width: 0 1px 0 0;
    border-style: solid;
    border-image: linear-gradient(
        to bottom,
        transparent,
        transparent 30%,
        ${p => p.theme.border} 30%,
        ${p => p.theme.border} 70%,
        transparent 70%,
        transparent
      )
      1;
    &:last-child {
      border: 0;
    }
  }

  ${GridBodyCell} {
    min-height: unset;
    padding: ${space(1)} ${space(1.5)};
    font-size: ${p => p.theme.fontSizeMedium};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    a {
      color: ${p => p.theme.textColor};
    }
  }
  a {
    text-decoration: underline;
    text-decoration-style: dotted;
    text-decoration-color: ${p => p.theme.border};
  }
`;
