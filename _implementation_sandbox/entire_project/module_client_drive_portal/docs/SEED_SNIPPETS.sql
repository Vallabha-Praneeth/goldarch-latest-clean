-- Sandbox seed snippets for client drive portal

-- 1) Create a client account
insert into client_accounts (name, status, created_by)
values ('Example Client Co', 'active', auth.uid());

-- 2) Add the current user as a client member
insert into client_memberships (client_id, user_id, role)
select id, auth.uid(), 'client_user'
from client_accounts
where name = 'Example Client Co'
limit 1;

-- 3) Map a Google Drive folder to the client
insert into client_drive_folders (client_id, drive_folder_id, drive_folder_name, created_by)
select id, '1yzKd2vELH61L7tcqFBVrjtbg4hPY5_-J', 'Client Root Folder', auth.uid()
from client_accounts
where name = 'Example Client Co'
limit 1;

-- 4) Grant the user access to the Client Portal section
insert into crm_section_access (user_id, section, access_level, created_by)
values (auth.uid(), 'client_portal', 'view', auth.uid())
on conflict (user_id, section) do update
set access_level = excluded.access_level;
