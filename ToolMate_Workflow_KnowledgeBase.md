# ToolMate Tool Check-Out Workflow

## Intended Flow

1. Technician submits a check-out request (status: `pending`).
2. Supervisor approves (status: `checked-out`, meaning the technician can now use the tool).
3. When the tool is returned, the supervisor fills out the check-in form (status: `checked-in`).

- Only supervisors can approve/reject requests and check in tools.
- Technicians only see their own requests and never see the check-in form.
- Supervisors see all requests and manage approvals and check-ins.

This workflow ensures clear separation of responsibilities and accurate tool tracking.

## User Roles

- By default, all users are assigned the role `technician` when they first sign up.
- To change a user's role (e.g., to `supervisor`), manually update the `role` field for that user in the Firebase `users` collection via the Firebase Console.
- The app uses the `role` field to determine permissions and UI for each user.



when i refresh the page at /toolmate as a supervisor, i dont see Export CSV button and also the arrove and reject button for check out tool, unless i click to go to IT Asset Tracker and click back on ToolMate before they appear. i want simple way for this to be solve


when i refresh the page at /toolmate as  a supervisor, i dont see Export CSV button and also the apimport { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from './firebase';
const auth = getAuth(app);rrove and reject button for check out tool, unless i click to go to IT Asset Tracker and click back on ToolMate before they appear. i want simple way for this to be solve


The root cause is that when you refresh on the ToolMate page, the user object from Firebase Auth may not be immediately available, so userRole is computed as 'technician' (the default), and supervisor features are hidden. Once the user object is set (after Firebase Auth state loads), the UI should update, but if it doesn't, it's likely because the user state is not triggering a re-render in time.

WE DONT WANT THIS TO HAPPEN BECAUSE WE HARD CODED WHO TO BE A SUPERVISOR; SO USE ON;Y THE HARDCODED; FROMM TOOLMATE CHECK FROM LOCAL STORAGE CURRENT USER EMAIL FROM IT ASSET ; MEANS STORE USER EMAIL KN LOCAL STOARAGE AND SHOW BUTTONS BASE ON USER EMAIL IF SUPERVISOR OR NOT FROM HARD CODED JUST LKE WE DID IN IT ASSET who can edit and edit or add asset



also


Now good. so now as we have the first name and last name and then it can also make the table, I want same first name and last name to do something for me, is that possible, by having another button which would have it own table but gets users the first and last name from the userform table for it own table with column headers


System-Name, DNS-Name, Status,Domain,Lastname,Firstname,Department, Building, Room, System Performance Group, Operating System,Mandant,Serialnumber