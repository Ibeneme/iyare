import { PageHeader, Panel, Avatar } from "../../../components/ui";
import useAuth from "../../../hooks/useAuth";
import { ROLE_LABEL } from "../../../config/roles";
import ChangePasswordPanel from "./ChangePasswordPanel";

/** Profile for admins and teachers (students and parents have the richer profile page). */
export default function AccountPage() {
  const { displayName, email, role, user, isSuperAdmin } = useAuth();
  return (
    <div className="page">
      <PageHeader eyebrow="Account" title="My profile" highlight="profile" />
      <Panel variant="binder">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={displayName} email={email} src={user?.avatarUrl || user?.profilePicture} size={88} />
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-primary)]">{displayName}</h2>
            <p className="text-sm text-[var(--color-muted)]">{email}</p>
            <span className="pill pill--green mt-2">{isSuperAdmin ? "Super Admin" : role ? ROLE_LABEL[role] : ""}</span>
          </div>
        </div>
      </Panel>
      <ChangePasswordPanel />
    </div>
  );
}
