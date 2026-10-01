import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Plus, UserPlus, Users } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { MetricCard } from '../components/ui/MetricCard';
import { Field, Input, Select } from '../components/ui/Form';
import { Modal } from '../components/ui/Modal';
import { SkeletonCard } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { DataTable } from '../components/ui/Table';
import { Avatar } from '../components/ui/Avatar';
import { useToast } from '../components/ui/ToastProvider';

const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const ROLE_FALLBACKS = ['ADMIN', 'EDITOR', 'VIEWER'];

const PRIORITY_TONES = { HIGH: 'error', MEDIUM: 'warning', LOW: 'info' };

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

const emptyInvite = { name: '', email: '', role: 'EDITOR' };
const emptyTask = { title: '', assignedTo: '', priority: 'MEDIUM', dueDate: '' };

export default function Team() {
  const { toast } = useToast();
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invite, setInvite] = useState(emptyInvite);
  const [taskDraft, setTaskDraft] = useState(emptyTask);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingInvite, setSavingInvite] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTeam();
      setMembers(res.members || []);
      setTasks(res.tasks || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handleInvite = async (event) => {
    event.preventDefault();
    if (!invite.email.trim()) {
      toast({ title: 'An email address is required', tone: 'warning' });
      return;
    }
    setSavingInvite(true);
    try {
      const res = await api.inviteTeamMember({
        name: invite.name.trim() || 'Team member',
        email: invite.email.trim(),
        role: invite.role,
      });
      setMembers((prev) => [...prev, res.member]);
      setInvite(emptyInvite);
      setInviteOpen(false);
      toast({ title: 'Invitation sent', description: res.member?.email, tone: 'success' });
    } catch (err) {
      toast({ title: 'Could not invite this member', description: err.message, tone: 'error' });
    } finally {
      setSavingInvite(false);
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!taskDraft.title.trim()) {
      toast({ title: 'A task title is required', tone: 'warning' });
      return;
    }
    setSavingTask(true);
    try {
      const res = await api.createTeamTask({
        title: taskDraft.title.trim(),
        assignedTo: taskDraft.assignedTo || members[0]?.name || 'Chloe Nguyen',
        priority: taskDraft.priority,
        ...(taskDraft.dueDate ? { dueDate: new Date(taskDraft.dueDate).toISOString() } : {}),
      });
      setTasks((prev) => [...prev, res.task]);
      setTaskDraft(emptyTask);
      setTaskOpen(false);
      toast({ title: 'Task created', description: res.task?.title, tone: 'success' });
    } catch (err) {
      toast({ title: 'Could not create the task', description: err.message, tone: 'error' });
    } finally {
      setSavingTask(false);
    }
  };

  const updateTaskStatus = async (task, status) => {
    setUpdatingTaskId(task.id);
    try {
      const res = await api.updateTeamTask(task.id, { status });
      setTasks((prev) => prev.map((item) => (item.id === task.id ? res.task : item)));
      toast({ title: 'Task updated', description: `${res.task?.title} · ${status.replace('_', ' ')}`, tone: 'success' });
    } catch (err) {
      toast({ title: 'Could not update the task', description: err.message, tone: 'error' });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const roleOptions = useMemo(() => {
    const seen = new Set(members.map((member) => member.role).filter(Boolean));
    return [...new Set([...seen, ...ROLE_FALLBACKS])];
  }, [members]);

  const openTasks = tasks.filter((task) => task.status !== 'DONE');
  const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS' || task.status === 'REVIEW');
  const completed = tasks.filter((task) => task.status === 'DONE');

  const taskColumns = [
    {
      key: 'title',
      header: 'Task',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-label font-semibold text-ink">{row.title}</p>
          <p className="mt-0.5 text-caption text-ink-3">Assigned to {row.assignedTo}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => (
        <Badge tone={PRIORITY_TONES[row.priority] || 'neutral'} size="sm">
          {row.priority || 'MEDIUM'}
        </Badge>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due',
      align: 'right',
      render: (row) => <span className="text-ink-2">{formatDate(row.dueDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Select
          value={row.status}
          disabled={updatingTaskId === row.id}
          onChange={(event) => updateTaskStatus(row, event.target.value)}
          aria-label={`Status for ${row.title}`}
        >
          {TASK_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item.replace('_', ' ')}
            </option>
          ))}
        </Select>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Workspace"
          title="Team collaboration"
          subtitle="Roles, editorial tasks and delivery ownership."
          icon={Users}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} rows={3} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Team unavailable"
        description={error.message || 'We could not load the workspace team.'}
        onRetry={loadTeam}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Team collaboration"
        subtitle="Roles, editorial tasks and delivery ownership across the workspace."
        icon={Users}
        action={
          <>
            <Badge tone="neutral" size="sm">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </Badge>
            <Button icon={UserPlus} onClick={() => setInviteOpen(true)}>
              Invite member
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Workspace members" value={String(members.length)} unit="people" caption="With workspace access" icon={Users} />
        <MetricCard label="Open tasks" value={String(openTasks.length)} caption="To do, in progress or in review" icon={ClipboardList} tone="warning" />
        <MetricCard label="In review" value={String(inProgress.length)} caption="Awaiting sign-off" icon={ClipboardList} tone="info" />
        <MetricCard label="Completed" value={String(completed.length)} caption="Shipped this cycle" icon={CheckCircle2} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <SectionCard
          className="xl:col-span-2"
          title="Workspace members"
          subtitle="Who can publish, edit and approve"
          icon={Users}
          action={
            <Button variant="ghost" size="sm" icon={UserPlus} onClick={() => setInviteOpen(true)}>
              Invite
            </Button>
          }
        >
          {members.length ? (
            <ul className="space-y-2.5">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="cs-inset flex items-center justify-between gap-3 px-3.5 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar src={member.avatar} name={member.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-label font-semibold text-ink">{member.name}</p>
                      <p className="truncate text-caption text-ink-3">{member.email}</p>
                    </div>
                  </div>
                  <Badge tone={member.role === 'OWNER' ? 'brand' : 'neutral'} size="sm">
                    {member.role}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Users}
              title="No teammates yet"
              description="Invite an editor or strategist to collaborate on the publishing calendar."
              action={
                <Button size="sm" icon={UserPlus} onClick={() => setInviteOpen(true)}>
                  Invite member
                </Button>
              }
            />
          )}
        </SectionCard>

        <div className="space-y-4 xl:col-span-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-label font-semibold text-ink">Editorial tasks</h2>
              <p className="mt-0.5 text-caption text-ink-3">
                Move work through the pipeline — changes save instantly.
              </p>
            </div>
            <Button variant="secondary" size="sm" icon={Plus} onClick={() => setTaskOpen(true)}>
              New task
            </Button>
          </div>

          <DataTable
            columns={taskColumns}
            rows={tasks}
            empty={
              <EmptyState
                icon={ClipboardList}
                title="No tasks assigned"
                description="Break the next production sprint into assignable tasks."
                action={
                  <Button size="sm" icon={Plus} onClick={() => setTaskOpen(true)}>
                    Create task
                  </Button>
                }
              />
            }
          />
        </div>
      </div>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a teammate"
        subtitle="They receive an email with workspace access."
        icon={UserPlus}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="invite-form" size="sm" icon={UserPlus} loading={savingInvite}>
              Send invite
            </Button>
          </>
        }
      >
        <form id="invite-form" onSubmit={handleInvite} className="space-y-4">
          <Field label="Full name" htmlFor="invite-name">
            <Input
              id="invite-name"
              value={invite.name}
              placeholder="Chloe Nguyen"
              onChange={(event) => setInvite({ ...invite, name: event.target.value })}
            />
          </Field>

          <Field label="Email address" htmlFor="invite-email" required>
            <Input
              id="invite-email"
              type="email"
              value={invite.email}
              placeholder="chloe@yourdomain.com"
              onChange={(event) => setInvite({ ...invite, email: event.target.value })}
            />
          </Field>

          <Field label="Role" htmlFor="invite-role" hint="Editors can publish; viewers are read-only.">
            <Select
              id="invite-role"
              value={invite.role}
              onChange={(event) => setInvite({ ...invite, role: event.target.value })}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      </Modal>

      <Modal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        title="New editorial task"
        subtitle="Assign production work with a priority and due date."
        icon={ClipboardList}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setTaskOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="task-form" size="sm" icon={Plus} loading={savingTask}>
              Create task
            </Button>
          </>
        }
      >
        <form id="task-form" onSubmit={handleCreateTask} className="space-y-4">
          <Field label="Task title" htmlFor="task-title" required>
            <Input
              id="task-title"
              value={taskDraft.title}
              placeholder="Edit the launch video hook"
              onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Assigned to" htmlFor="task-owner">
              <Select
                id="task-owner"
                value={taskDraft.assignedTo}
                onChange={(event) => setTaskDraft({ ...taskDraft, assignedTo: event.target.value })}
              >
                {members.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Priority" htmlFor="task-priority">
              <Select
                id="task-priority"
                value={taskDraft.priority}
                onChange={(event) => setTaskDraft({ ...taskDraft, priority: event.target.value })}
              >
                {PRIORITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Due date" htmlFor="task-due">
            <Input
              id="task-due"
              type="date"
              value={taskDraft.dueDate}
              onChange={(event) => setTaskDraft({ ...taskDraft, dueDate: event.target.value })}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}

