import { PluginData } from "knub";
import { CasesPluginType } from "../types";
import { disableLinkPreviews, messageLink } from "../../../utils";
import { DBDateFormat, getDateFormat } from "../../../utils/dateFormats";
import { CaseTypes } from "../../../data/CaseTypes";
import moment from "moment-timezone";
import { Case } from "../../../data/entities/Case";
import { inGuildTz } from "../../../utils/timezones";

const CASE_SUMMARY_REASON_MAX_LENGTH = 300;
const INCLUDE_MORE_NOTES_THRESHOLD = 20;
const UPDATED_STR = "__[Update]__";

export async function getCaseSummary(
  pluginData: PluginData<CasesPluginType>,
  caseOrCaseId: Case | number,
  withLinks = false,
) {
  const caseId = caseOrCaseId instanceof Case ? caseOrCaseId.id : caseOrCaseId;

  const theCase = await pluginData.state.cases.with("notes").find(caseId);

  const firstNote = theCase.notes[0];
  let reason = firstNote ? firstNote.body : "";
  let leftoverNotes = Math.max(0, theCase.notes.length - 1);

  for (let i = 1; i < theCase.notes.length; i++) {
    if (reason.length >= CASE_SUMMARY_REASON_MAX_LENGTH - UPDATED_STR.length - INCLUDE_MORE_NOTES_THRESHOLD) break;
    reason += ` ${UPDATED_STR} ${theCase.notes[i].body}`;
    leftoverNotes--;
  }

  if (reason.length > CASE_SUMMARY_REASON_MAX_LENGTH) {
    const match = reason.slice(CASE_SUMMARY_REASON_MAX_LENGTH, 100).match(/(?:[.,!?\s]|$)/);
    const nextWhitespaceIndex = match ? CASE_SUMMARY_REASON_MAX_LENGTH + match.index : CASE_SUMMARY_REASON_MAX_LENGTH;
    if (nextWhitespaceIndex < reason.length) {
      reason = reason.slice(0, nextWhitespaceIndex - 1) + "...";
    }
  }

  reason = disableLinkPreviews(reason);

  const timestamp = moment.utc(theCase.created_at, DBDateFormat);
  const prettyTimestamp = inGuildTz(pluginData, timestamp).format(getDateFormat(pluginData, "date"));

  let caseTitle = `\`Case #${theCase.case_number}\``;
  if (withLinks && theCase.log_message_id) {
    const [channelId, messageId] = theCase.log_message_id.split("-");
    caseTitle = `[${caseTitle}](${messageLink(pluginData.guild.id, channelId, messageId)})`;
  } else {
    caseTitle = `\`${caseTitle}\``;
  }
  const caseType = `__${CaseTypes[theCase.type]}__`;

  let line = `\`[${prettyTimestamp}]\` ${caseTitle} ${caseType} ${reason}`;
  if (leftoverNotes > 1) {
    line += ` *(+${leftoverNotes} ${leftoverNotes === 1 ? "note" : "notes"})*`;
  }

  if (theCase.is_hidden) {
    line += " *(hidden)*";
  }

  return line;
}
