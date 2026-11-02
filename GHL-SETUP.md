# GoHighLevel setup and nurture workflows

The new site sends three kinds of leads to GoHighLevel (GHL), each with tags that start a nurture workflow:

- **Agent Quest reports**
- **Follow-up requests from the Ask Akrithos guide**
- **Signals from later visits:** what a known visitor does afterwards

This page covers what to set up in GHL and Vercel, every tag the site uses, and the workflows to build. The workflow section includes email drafts in the brand voice.

Nothing is sent without the visitor ticking the consent box. The site never asks for health, patient or confidential details.

## 1. Connect the site (about 15 minutes)

1. **Create a Private Integration token** in the Akrithos sub-account:
   - Go to Settings, then Private Integrations, then Create new integration.
   - Name it "akrithos.com website" and give it the **contacts.write** scope (nothing else is needed).
   - The token is shown once, so copy it straight into Vercel (step 3).
2. **Find the location ID:** Settings, then Business Profile (it is also in the sub-account URL).
3. **Add the variables in Vercel** (Project, then Settings, then Environment Variables) for Production and Preview:

   | Variable | Value |
   |---|---|
   | `GHL_PRIVATE_TOKEN` | the token from step 1 |
   | `GHL_LOCATION_ID` | the location ID from step 2 |
   | `LEAD_SIGNING_SECRET` | 64 random characters. Create them with `openssl rand -hex 32` |
   | `ANTHROPIC_API_KEY` | your Anthropic key (powers the guide and the blueprint) |
   | `ANTHROPIC_MODEL` | a current model name, for example `claude-haiku-5-5` (fast and low-cost for a website guide). Check the name at docs.claude.com |
   | `ASK_DAILY_LIMIT` | optional, default 600 guide answers a day per server instance |
   | `GHL_FIELD_IDS` | optional, see step 4 |

4. **Optional: personalised emails.**
   - Create these contact custom fields (Settings, then Custom Fields, then Contact):

     | Field name | Type |
     |---|---|
     | AK Level | single line |
     | AK Score | number |
     | AK First Agent | single line |
     | AK Path | single line |
     | AK Hours Year | number |
     | AK Industry | single line |

   - Copy each field's ID into one JSON value, using the keys on the left:

     ```json
     {"ak_level":"FIELD_ID","ak_score":"FIELD_ID","ak_first_agent":"FIELD_ID","ak_path":"FIELD_ID","ak_hours_year":"FIELD_ID","ak_industry":"FIELD_ID"}
     ```

   - Without this step, everything still works: the result is saved as a note on the contact, and the tags drive the workflows.
5. **Redeploy** in Vercel so the variables take effect.
6. **Check the connection:**
   - Play Agent Quest on the live site with your own email and tick the box.
   - The contact should appear within seconds, with the tags below and a note holding the quest result.

**Security notes:**
- The token lives only on the server; the browser never sees it.
- Rotate the token every 90 days. GHL's "Rotate and expire later" keeps the old one working for 7 days while you update Vercel.

## 2. What the site sends

| Visitor does | Contact source | Tags added | Note on the contact |
|---|---|---|---|
| Finishes Agent Quest and asks for the report | Website: quest | `ak-website`, `ak-source-quest`, `ak-consent-email`, `ak-quest-done`, `ak-industry-…`, `ak-bottleneck-…`, `ak-boundary-…`, `ak-timing-…`, `ak-level-…`, `ak-path-…`, plus one of `ak-hot`, `ak-warm`, `ak-learn` | Level, score, first agent, every answer, hours at stake (their own estimate) |
| Asks the guide for a person to follow up | Website: assistant | `ak-website`, `ak-source-assistant`, `ak-consent-email`, `ak-interest-diagnostic`, `ak-interest-training` or `ak-interest-blueprint` | Their first question, in their words |
| Later visits (known visitors only) | | `ak-event-opened-booking`, `ak-event-viewed-training`, `ak-event-used-blueprint`, `ak-event-asked-assistant`, `ak-event-replayed-quest`, `ak-event-returned` | |

**Tag values:**

| Tag | Values |
|---|---|
| `ak-industry-` | healthcare, finance, government, services, commerce, other |
| `ak-bottleneck-` | leads, knowledge, documents, service, scheduling, reporting |
| `ak-boundary-` | none, customer, regulated, classified |
| `ak-timing-` | month, quarter, exploring |
| `ak-level-` | scout, builder, operator, orchestrator |
| `ak-path-` | diagnostic, blueprint, training |

**How the path is chosen:**

| Path | Tag | When |
|---|---|---|
| diagnostic | `ak-hot` | Big opportunity and a timeline |
| blueprint | `ak-warm` | Big opportunity, but still exploring, or a smaller opportunity with a timeline |
| training | `ak-learn` | Smaller opportunity and exploring |

**Re-triggering:**
- Tags are only ever added by the site, never removed.
- A tag that is already on a contact does not fire its trigger again.
- So an "interaction" workflow that should be able to run again must remove its own tag as its last step. This is noted on each workflow below.

## 3. Workflows to build

**For every workflow:**
- Build it in Automation, then Workflows.
- Turn on "Allow re-entry" only where noted.
- Add the goal **"Appointment booked: Diagnostic calendar"**, so anyone who books leaves the nurture at once.

**For every email:**
- Send from a real person (Alex), in plain text style, with GHL's unsubscribe footer.
- Merge fields such as `{{contact.ak_first_agent}}` work once step 1.4 is done (use the merge key GHL shows next to each custom field). Without that step, use the generic line shown in brackets.

### W1. Quest report (everyone who finishes the quest)

- **Trigger:** Contact tag added, `ak-quest-done`.
- **Steps:** send email **R1** immediately, then add to the workflow matching their path tag (W2, W3 or W4).

**R1. Subject:** Your Agent Quest result: {{contact.ak_level}}

> Hi {{contact.first_name}},
>
> You finished Agent Quest as a **{{contact.ak_level}}**, with a score of {{contact.ak_score}} out of 100.
>
> Your first agent: **{{contact.ak_first_agent}}** [or: the agent that fits the work you described].
>
> From your own estimate, about {{contact.ak_hours_year}} hours a year go into that work. That is the size of the prize.
>
> Three questions to settle before anyone builds:
> 1. What exactly counts as "done" for this work, and how will you measure it?
> 2. Which data may the agent see, and what must stay out of reach?
> 3. Who approves what the agent prepares, and how fast?
>
> These are exactly what the Diagnostic answers in one focused session: [Book your Diagnostic]
>
> Alex
> Akrithos

### W2. Hot path (`ak-hot`)

1. **Immediately:**
   - An internal notification to Alex (email and app): "Hot lead from Agent Quest: {{contact.first_name}}, first agent {{contact.ak_first_agent}}. Their answers are in the contact note."
   - Create a task: "Call or email within 1 business day".
2. **After 2 days:** if no appointment, send **H1**.
3. **After 5 days:** if no appointment, send **H2**.
4. **After 9 days:** if no appointment, send **H3**, then move them into W3 (warm).

**H1. Subject:** What your first agent would actually do

> Hi {{contact.first_name}}, a quick picture of a {{contact.ak_first_agent}} in a week of your work: it takes the repeat part off your team's desks, prepares each decision as a short brief, and a named person approves anything that matters. Nothing leaves your boundary, and every step is logged.
>
> Want to see it against your real workflow? [Book your Diagnostic]

**H2. Subject:** One workflow, one session, one decision

> Most teams try to automate everything at once and stall. We start with one workflow, define the target, the data boundary, the acceptance criteria and who reviews what, then decide whether to build. That is the Diagnostic. [Pick a time]

**H3. Subject:** Should I close your file?

> Hi {{contact.first_name}}, I don't want to crowd your inbox. If the timing changed, reply "later" and I'll check back next quarter. If you would still like your first agent working this quarter, here is my calendar: [Book your Diagnostic]

### W3. Warm path (`ak-warm`)

| When | Send | Content |
|---|---|---|
| Day 1 | **B1** | "Sketch it in two minutes": a link to the blueprint builder on the site, plus one example blueprint for their bottleneck |
| Day 5 | **B2** | "Where people stay in control": one paragraph on approvals and boundaries, with a link to the Security section |
| Day 12 | **B3** | A Diagnostic invitation |
| Day 30 | **B4** | Live training invitation (Single Session $30) for anyone who wants to learn first |

### W4. Learn path (`ak-learn`)

| When | Send | Content |
|---|---|---|
| Day 0 | **T1** | "Learn to build agents live": twelve sessions on Tuesdays, 12:00 to 1:00 PM Central, no coding required. Start with a Single Session for $30 |
| Day 4 | **T2** | Founding Cohort, $250, recordings kept for good |
| Day 14 | **T3** | "When you're ready for your own agent": the Diagnostic |

### W5. Guide hand-off (`ak-source-assistant`)

1. **Immediately:** internal notification to Alex with the contact note (their question), plus a task to reply within 1 business day.
2. **Immediately:** send **G1** to the visitor.

**G1. Subject:** Got your question

> Hi {{contact.first_name}}, thanks for asking. A person from Akrithos (not a bot) will reply within one business day. If it is easier, pick a time here: [Book your Diagnostic]

### W6. Interaction signals (allow re-entry; each removes its own tag as its last step)

| Trigger tag | Wait | Condition | Action |
|---|---|---|---|
| `ak-event-opened-booking` | 1 day | No appointment | "Still want to talk?" email with the calendar link |
| `ak-event-viewed-training` | 1 hour | Not `ak-hot` | Add to W4 |
| `ak-event-returned` | None | Has `ak-hot` and no appointment | Internal notification: "Hot lead is back on the site now" |
| `ak-event-used-blueprint` | 2 hours | None | Email: "Want us to turn that blueprint into a plan?", linking to the Diagnostic |
| `ak-event-replayed-quest` | None | None | Internal note only |

### W7. Booked

- **Trigger:** appointment booked on the Diagnostic calendar, or the Diagnostic form submitted.
- **Steps:**
  1. Remove the contact from W2, W3 and W4.
  2. Send **P1** at once.
  3. Send a reminder 24 hours before the appointment.

**P1. Subject:** Before our Diagnostic

> Bring one workflow that repeats every week, rough numbers for how often and how long it takes, who approves the work today, and any rules about where the data must stay. Please don't send patient or confidential records; we only need the shape of the work.

### W8. Monthly digest

- **Who:** everyone with `ak-consent-email` who has not unsubscribed.
- **What:** one short idea a month (an agent pattern, a control that worked, a training date).

## 4. Before you switch it on

1. Send yourself every email in the workflows, on phone and desktop.
2. Click every link in every email.
3. Unsubscribe from one email, then check that the contact's DND is set and no further email arrives.
4. Book a test Diagnostic and check that the contact leaves W2 to W4.
5. **HIPAA:** your account has the HIPAA add-on. Even so, keep forms and these workflows free of health details. The site never asks for them, and the emails should not either.
