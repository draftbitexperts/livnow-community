# Product Feedback Notes — Full Consolidated Document

> Consolidated from design review session screenshots and chat analysis.
> Priority items marked with ⭐. Version-scoped items marked with [v2.1]. Open action items marked with 🔴.

---

# PART 1 — Dashboard

## User Stories / Jobs to Be Done

**Community Manager — Workload Overview**
- As a Community Manager, I want to see the total number of active and completed moves at a glance so that I can quickly assess current workload.

**Community Contact — Upcoming Move-In Roster**
- As a Community Contact, I need to view an upcoming roster of move-in dates so I can prepare for incoming residents.

**⭐ Community Contact — Relocation Specialist Updates** *(Priority)*
- As a Community Contact, I want to see recent updates and notes related to my community from my Relocation Specialist so that I'm always informed about the latest changes.

**User — Filter Updates**
- As a User, I want to be able to filter updates by date, resident name, specialist, and move type so I can find relevant information quickly.

**User — Search Bar**
- As a User, I need a search bar to quickly locate specific updates without scrolling through all entries.

**Relocation Specialist — Top Referring Contacts**
- As a Relocation Specialist, I want to see which Community Contacts are submitting the most residents as referrals.

**Community Contact — Referral Source Breakdown**
- As a Community Contact, I want to see what sources (website submissions, LivNow Relocation Specialist, Community Team Members) are responsible for resident referrals.

**⭐ Manager of Multiple Communities — Drill-Down View** *(Priority)*
- As a Manager of Multiple Communities, I want to be able to drill down into specific communities to see their activities.

---

## Community Updates — Design Note

- Community Name field has been added to the Community Updates section.
- Decision pending on whether Community Name should also be applied to the other two dashboards. The field is ready and can be added if confirmed.

---

## Calendar — Multiple Events on the Same Day

- If more than one event falls on the same day, the hover tooltip should list all events with a divider between each entry.
- If one event is in-person and another is a webinar, the in-person event color should be used for the calendar day indicator.

---

## Team Members List — Multiple Communities Selected

- When more than one community is selected, the Community Name should be included alongside each team member in the list.

---

## At a Glance — Hover Information

- The hover tooltip in the At a Glance section must also include the Community Name alongside other displayed information.

---

# PART 2 — All Residents

## User Stories / Jobs to Be Done

**Community Contact — Add New Resident**
- As a Community Contact, I want to add a new resident easily so that I can initiate the relocation process without confusion.
- Design note: Since it is a Community Manager adding the resident, the community field should auto-default to their community.

**User — Resident Status Categories**
- As a User, I need to view residents in categories like Prospective, In Progress, and Current so I can track where each person is in the process.

**User — Search Residents by Name**
- As a User, I want to be able to search for residents by name to quickly locate their information.

**User — Filter Residents**
- As a User, I want to filter residents by status, move-in date, or community so that I can manage large lists effectively.

**User — Resident Detail View**
- As a User, I need the ability to view resident details, including contact information, move-in dates, and related notes, for better context during conversations.

**⭐ User — Supply Partner Visibility** *(Priority)*
- As a User, I need to be able to see which Supply Partners the resident is working with.

**🤖 Relocation Specialist — Profile Change Notifications**
- As a Relocation Specialist, I need to be notified when something on a resident's profile changes.

**⭐ User — Add Notes to Resident Page** *(Priority)*
- As a User, I need to be able to add notes to a Resident's page.

**⭐ User — Account Activity Log** *(Priority)*
- As a User, I need to be able to see any and all users who took action on the Resident's account.

---

# PART 3 — All Resident Contacts

## User Stories / Jobs to Be Done

**Community Contact — Add New Contact & Link to Resident**
- As a Community Contact, I want to add new contacts and link them to residents so that I have complete information about decision-makers.

**User — Contact List with Key Details**
- As a User, I need to view a list of contacts with key details like name, role (family, trustee, etc.), and associated resident for easy reference.

**User — Edit Contact Details**
- As a User, I want to be able to edit contact details to ensure information stays up-to-date.

**User — Search & Filter Contacts**
- As a User, I need to search and filter contacts based on name, role, or resident association for efficiency.
- Design note: Filter options can be whatever is needed based on the requirements. Follow existing design patterns.

---

# PART 4 — Resident Detail

## User Stories / Jobs to Be Done

**Community Contact — Add New Resident**
- As a Community Contact, I want to add a new resident easily so that I can initiate the relocation process without confusion.

**User — Resident Status Categories**
- As a User, I need to view residents in categories like Prospective, In Progress, and Current so I can track where each person is in the process.

**User — Search Residents by Name**
- As a User, I want to be able to search for residents by name to quickly locate their information.

**User — Filter Residents**
- As a User, I want to filter residents by status, move-in date, or community so that I can manage large lists effectively.

**User — View Resident Details**
- As a User, I need the ability to view resident details, including contact information, move-in dates, and related notes, for better context during conversations.

**⭐ User — Supply Partner Visibility** *(Priority)*
- As a User, I need to be able to see which Supply Partners the resident is working with.

**🤖 Relocation Specialist — Profile Change Notifications**
- As a Relocation Specialist, I need to be notified when something on a resident's profile changes.

**⭐ User — Add Notes to Resident Page** *(Priority)*
- As a User, I need to be able to add notes to a Resident's page.

**⭐ User — Account Activity Log** *(Priority)*
- As a User, I need to be able to see any and all users who took action on the Resident's account.

---

## Notification System — Design Notes

**Scope of Notifications**
- When the notification system gets built out, it should include messages from the chat thread, as well as changes to things like resident tasks, new community updates, milestones, etc.

**Implementation Approach**
- The idea is to use an out-of-the-box solution and style it to fit within the app.
- A red dot indicator should be used to signal a new message or unread notification.

---

## Supply Partners Tab — Milestone Flows

Each supply partner type follows a defined milestone flow. Realtor partners have a unique flow; all other partner types share a standard flow.

**Realtor — Milestone Flow**
- Referred → from here the resident may proceed to Listed, Declined, or Canceled.
- Listed (e.g. Coldwell Banker) → Under Contract → Closed
- Alternative exits from any stage: Declined or Canceled

**All Other Supply Partners — Milestone Flow**
- Referred → Active (e.g. Downsizing by Design) → Completed
- Alternative exits from any stage: Declined or Canceled

| Supply Partner Type | Milestone Flow | Notes |
|---|---|---|
| Realtor | Referred → Listed → Under Contract → Closed | Unique flow. Example: Coldwell Banker. Exits: Declined, Canceled. |
| All Other Partners | Referred → Active → Completed | Standard flow. Example: Downsizing by Design. Exits: Declined, Canceled. |

---

## Resident Contact Section — Design Notes

**Primary Contact**
- If no primary contact has been input, the form should be open upon landing on the section.
- The Save button becomes active only when the form is filled out.

> 🔴 **Open item:** Lisa is checking on what options to display for the 'Relationship' field.

---

# PART 5 — Communities Screen

## User Stories / Jobs to Be Done

**Community Admin — View & Edit Community Details**
- As a Community Admin, I want to view and edit community details (name, address, phone number, website) to ensure accuracy.

**User — Upload Marketing Materials** *(v2.1)*
- As a User, I need a section to upload marketing materials like logos and brand colors to maintain consistent branding.

**User — Community Contacts List**
- As a User, I want to see a list of contacts at each community so that I can easily reach the right people.

**⭐ User — Parent Company Structure** *(Priority)*
- As a User, I need to understand the parent company structure to see which communities are related and who oversees them.

**User — Upload Floor Plans**
- As a User, I want to be able to upload floor plans for my community.

---

# Open Items & Action Items

| # | Item | Owner | Status |
|---|---|---|---|
| 1 | Confirm whether Community Name should appear on the other two dashboards (beyond Community Updates) | TBD | Pending |
| 2 | Confirm options to display for the 'Relationship' field in Resident Contact section | Lisa | In progress |