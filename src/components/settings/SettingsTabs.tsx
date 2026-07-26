'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UploadButton } from '@/utils/uploadthing'
import {
  updateSchoolSettings,
  updatePeriod,
  setActivePeriod,
  addPeriod,
  deletePeriod,
  addSubject,
  deleteSubject,
  addSection,
  updateSection,
  deleteSection,
  assignTeacher,
  removeSectionSubject,
  addSubjectToSection,
} from '@/server/settings'

type SchoolData = { id: string; name: string; periodType: string | null; schoolYear: string | null; logo: string | null }
type PeriodData = { id: string; label: string; order: number; startDate: Date | null; endDate: Date | null; isActive: boolean }
type SubjectData = { id: string; name: string }
type SectionSubjectData = {
  id: string; sectionId: string; subjectId: string; teacherId: string | null
  subject: SubjectData
  teacher: { id: string; user: { name: string | null } } | null
}
type SectionData = {
  id: string; name: string; gradeLevel: string
  _count: { students: number }
  sectionSubjects: SectionSubjectData[]
}
type TeacherData = { id: string; user: { name: string | null; email: string } }

interface Props {
  school: SchoolData
  periods: PeriodData[]
  subjects: SubjectData[]
  sections: SectionData[]
  teachers: TeacherData[]
}

export function SettingsTabs({ school, periods: initialPeriods, subjects: initialSubjects, sections: initialSections, teachers }: Props) {
  return (
    <Tabs defaultValue="general">
      <TabsList variant="line">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="periods">Periods</TabsTrigger>
        <TabsTrigger value="subjects">Subjects</TabsTrigger>
        <TabsTrigger value="sections">Sections</TabsTrigger>
        <TabsTrigger value="teachers">Teacher Assignment</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="mt-6">
        <GeneralTab school={school} />
      </TabsContent>
      <TabsContent value="periods" className="mt-6">
        <PeriodsTab initialPeriods={initialPeriods} schoolId={school.id} />
      </TabsContent>
      <TabsContent value="subjects" className="mt-6">
        <SubjectsTab initialSubjects={initialSubjects} schoolId={school.id} />
      </TabsContent>
      <TabsContent value="sections" className="mt-6">
        <SectionsTab initialSections={initialSections} schoolId={school.id} />
      </TabsContent>
      <TabsContent value="teachers" className="mt-6">
        <TeacherAssignmentTab initialSections={initialSections} subjects={initialSubjects} teachers={teachers} />
      </TabsContent>
    </Tabs>
  )
}

// ─── General ────────────────────────────────────────────────────────────────

function GeneralTab({ school }: { school: SchoolData }) {
  const router = useRouter()
  const [name, setName] = useState(school.name)
  const [schoolYear, setSchoolYear] = useState(school.schoolYear ?? '')
  const [periodType, setPeriodType] = useState(school.periodType ?? '')
  const [logo, setLogo] = useState(school.logo)
  const [pending, startTransition] = useTransition()

  const initials = name.trim().split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'S'

  function save() {
    startTransition(async () => {
      try {
        await updateSchoolSettings(school.id, { name, schoolYear, periodType })
        toast.success('Settings saved')
        router.refresh()
      } catch {
        toast.error('Failed to save settings')
      }
    })
  }

  function handleLogoUpload(url: string) {
    setLogo(url)
    startTransition(async () => {
      try {
        await updateSchoolSettings(school.id, { logo: url })
        toast.success('Logo updated')
        router.refresh()
      } catch {
        toast.error('Failed to update logo')
        setLogo(school.logo)
      }
    })
  }

  return (
    <div className="space-y-5 max-w-xl">
      {/* Logo */}
      <div className="rounded-xl border border-border p-6 space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">School logo</p>
          <div className="flex items-center gap-4">
            {logo ? (
              <Image
                src={logo}
                alt={name}
                width={56}
                height={56}
                className="rounded-xl object-cover w-14 h-14 border border-border"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <span className="text-lg font-semibold text-primary-foreground">{initials}</span>
              </div>
            )}
            <UploadButton
              endpoint="schoolLogo"
              onClientUploadComplete={(res) => {
                const url = res[0]?.url
                if (url) handleLogoUpload(url)
              }}
              onUploadError={(err) => { toast.error(err.message) }}
              appearance={{
                button: 'bg-primary !text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors ut-readying:bg-primary ut-uploading:bg-primary',
                allowedContent: 'hidden',
              }}
              content={{ button: 'Upload logo' }}
            />
          </div>
        </div>
      </div>

      {/* Settings form */}
      <div className="rounded-xl border border-border p-6 space-y-5">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">School name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">School year</Label>
          <Input value={schoolYear} onChange={e => setSchoolYear(e.target.value)} placeholder="2025-2026" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Period type</Label>
          <Input value={periodType} onChange={e => setPeriodType(e.target.value)} placeholder="Trimester" />
        </div>
        <button
          onClick={save}
          disabled={pending}
          className="rounded-lg px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

// ─── Periods ─────────────────────────────────────────────────────────────────

function PeriodsTab({ initialPeriods, schoolId }: { initialPeriods: PeriodData[]; schoolId: string }) {
  const router = useRouter()
  const [periods, setPeriods] = useState(initialPeriods)
  const [pending, startTransition] = useTransition()

  useEffect(() => { setPeriods(initialPeriods) }, [initialPeriods])

  function toDateInputValue(date: Date | null): string {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }

  function handleBlur(periodId: string, data: { label?: string; startDate?: string; endDate?: string }) {
    startTransition(async () => {
      try {
        await updatePeriod(periodId, data)
        router.refresh()
      } catch {
        toast.error('Failed to update period')
      }
    })
  }

  function handleSetActive(periodId: string) {
    setPeriods(prev => prev.map(p => ({ ...p, isActive: p.id === periodId })))
    startTransition(async () => {
      try {
        await setActivePeriod(schoolId, periodId)
        toast.success('Active period updated')
        router.refresh()
      } catch {
        toast.error('Failed to set active period')
        setPeriods(initialPeriods)
      }
    })
  }

  function handleDelete(periodId: string) {
    const period = periods.find(p => p.id === periodId)
    if (period?.isActive) { toast.error('Cannot delete the active period'); return }
    setPeriods(prev => prev.filter(p => p.id !== periodId))
    startTransition(async () => {
      try {
        await deletePeriod(periodId)
        toast.success('Period deleted')
        router.refresh()
      } catch {
        toast.error('Cannot delete — period has grade entries')
        setPeriods(initialPeriods)
      }
    })
  }

  function handleAdd() {
    const order = periods.length + 1
    startTransition(async () => {
      try {
        const p = await addPeriod(schoolId, `Period ${order}`, order)
        setPeriods(prev => [...prev, { id: p.id, label: p.label, order: p.order, startDate: p.startDate, endDate: p.endDate, isActive: p.isActive }])
        router.refresh()
      } catch {
        toast.error('Failed to add period')
      }
    })
  }

  return (
    <div className="space-y-3 max-w-2xl">
      <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        {periods.map(period => (
          <div key={period.id} className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {period.isActive
                  ? <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">Active</Badge>
                  : (
                    <button
                      onClick={() => handleSetActive(period.id)}
                      disabled={pending}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Set active
                    </button>
                  )
                }
              </div>
              <button
                onClick={() => handleDelete(period.id)}
                disabled={period.isActive || pending}
                className="text-xs text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Delete
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Label</Label>
                <Input
                  key={period.id + '-label'}
                  defaultValue={period.label}
                  onBlur={e => handleBlur(period.id, { label: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Start date</Label>
                <Input
                  type="date"
                  key={period.id + '-start'}
                  defaultValue={toDateInputValue(period.startDate)}
                  onBlur={e => handleBlur(period.id, { startDate: e.target.value || undefined })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">End date</Label>
                <Input
                  type="date"
                  key={period.id + '-end'}
                  defaultValue={toDateInputValue(period.endDate)}
                  onBlur={e => handleBlur(period.id, { endDate: e.target.value || undefined })}
                />
              </div>
            </div>
          </div>
        ))}
        {periods.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">No periods yet.</div>
        )}
      </div>
      <button
        onClick={handleAdd}
        disabled={pending}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
      >
        + Add period
      </button>
    </div>
  )
}

// ─── Subjects ────────────────────────────────────────────────────────────────

function SubjectsTab({ initialSubjects, schoolId }: { initialSubjects: SubjectData[]; schoolId: string }) {
  const router = useRouter()
  const [subjects, setSubjects] = useState(initialSubjects)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => { setSubjects(initialSubjects) }, [initialSubjects])

  function handleDelete(subjectId: string) {
    setSubjects(prev => prev.filter(s => s.id !== subjectId))
    startTransition(async () => {
      try {
        await deleteSubject(subjectId)
        toast.success('Subject deleted')
        router.refresh()
      } catch {
        toast.error('Cannot delete — subject has grade entries')
        setSubjects(initialSubjects)
      }
    })
  }

  function handleAdd() {
    const trimmed = newName.trim()
    if (!trimmed) return
    startTransition(async () => {
      try {
        const s = await addSubject(schoolId, trimmed)
        setSubjects(prev => [...prev, { id: s.id, name: s.name }])
        setNewName('')
        setAdding(false)
        toast.success('Subject added')
        router.refresh()
      } catch {
        toast.error('Failed to add subject')
      }
    })
  }

  return (
    <div className="space-y-3 max-w-xl">
      <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        {subjects.map(subject => (
          <div key={subject.id} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-foreground">{subject.name}</span>
            <button
              onClick={() => handleDelete(subject.id)}
              disabled={pending}
              className="text-xs text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-30 cursor-pointer"
            >
              Delete
            </button>
          </div>
        ))}
        {subjects.length === 0 && !adding && (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">No subjects yet.</div>
        )}
        {adding && (
          <div className="flex items-center gap-2 px-5 py-3">
            <Input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Subject name"
              className="flex-1"
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') { setAdding(false); setNewName('') }
              }}
            />
            <button
              onClick={handleAdd}
              disabled={pending || !newName.trim()}
              className="rounded-md px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Add
            </button>
            <button
              onClick={() => { setAdding(false); setNewName('') }}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          + Add subject
        </button>
      )}
    </div>
  )
}

// ─── Sections ────────────────────────────────────────────────────────────────

function SectionsTab({ initialSections, schoolId }: { initialSections: SectionData[]; schoolId: string }) {
  const router = useRouter()
  const [sections, setSections] = useState(initialSections)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editGrade, setEditGrade] = useState('')
  const [addingName, setAddingName] = useState('')
  const [addingGrade, setAddingGrade] = useState('')
  const [showAddRow, setShowAddRow] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => { setSections(initialSections) }, [initialSections])

  function startEdit(s: SectionData) {
    setEditingId(s.id)
    setEditName(s.name)
    setEditGrade(s.gradeLevel)
  }

  function handleSave(sectionId: string) {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, name: editName, gradeLevel: editGrade } : s))
    setEditingId(null)
    startTransition(async () => {
      try {
        await updateSection(sectionId, editName, editGrade)
        router.refresh()
      } catch {
        toast.error('Failed to save section')
        setSections(initialSections)
      }
    })
  }

  function handleDelete(sectionId: string) {
    setSections(prev => prev.filter(s => s.id !== sectionId))
    startTransition(async () => {
      try {
        await deleteSection(sectionId)
        toast.success('Section deleted')
        router.refresh()
      } catch {
        toast.error('Cannot delete — section has students or assignments')
        setSections(initialSections)
      }
    })
  }

  function handleAdd() {
    const name = addingName.trim()
    const grade = addingGrade.trim()
    if (!name || !grade) return
    startTransition(async () => {
      try {
        const s = await addSection(schoolId, name, grade)
        setSections(prev => [...prev, { id: s.id, name: s.name, gradeLevel: s.gradeLevel, _count: { students: 0 }, sectionSubjects: [] }])
        setAddingName('')
        setAddingGrade('')
        setShowAddRow(false)
        toast.success('Section added')
        router.refresh()
      } catch {
        toast.error('Failed to add section')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Section Name</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Grade Level</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Students</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sections.map(section => (
              <tr key={section.id}>
                <td className="px-5 py-3">
                  {editingId === section.id
                    ? <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-sm" />
                    : <span className="text-foreground">{section.name}</span>
                  }
                </td>
                <td className="px-5 py-3">
                  {editingId === section.id
                    ? <Input value={editGrade} onChange={e => setEditGrade(e.target.value)} className="h-7 text-sm w-28" />
                    : <span className="text-muted-foreground">{section.gradeLevel}</span>
                  }
                </td>
                <td className="px-5 py-3 text-muted-foreground">{section._count.students}</td>
                <td className="px-5 py-3 text-right space-x-3">
                  {editingId === section.id ? (
                    <>
                      <button onClick={() => handleSave(section.id)} className="text-xs text-foreground font-medium hover:underline cursor-pointer">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(section)} className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Edit</button>
                      <button onClick={() => handleDelete(section.id)} disabled={pending} className="text-xs text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-30 cursor-pointer">Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {showAddRow && (
              <tr>
                <td className="px-5 py-3">
                  <Input autoFocus value={addingName} onChange={e => setAddingName(e.target.value)} placeholder="Section name" className="h-7 text-sm" />
                </td>
                <td className="px-5 py-3">
                  <Input value={addingGrade} onChange={e => setAddingGrade(e.target.value)} placeholder="Grade 7" className="h-7 text-sm w-28" />
                </td>
                <td className="px-5 py-3 text-muted-foreground text-xs">—</td>
                <td className="px-5 py-3 text-right space-x-3">
                  <button onClick={handleAdd} disabled={pending || !addingName.trim() || !addingGrade.trim()} className="text-xs text-foreground font-medium hover:underline disabled:opacity-50 cursor-pointer">Add</button>
                  <button onClick={() => { setShowAddRow(false); setAddingName(''); setAddingGrade('') }} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">Cancel</button>
                </td>
              </tr>
            )}
            {sections.length === 0 && !showAddRow && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">No sections yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {!showAddRow && (
        <button onClick={() => setShowAddRow(true)} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          + Add section
        </button>
      )}
    </div>
  )
}

// ─── Teacher Assignment ───────────────────────────────────────────────────────

function TeacherAssignmentTab({
  initialSections,
  subjects,
  teachers,
}: {
  initialSections: SectionData[]
  subjects: SubjectData[]
  teachers: TeacherData[]
}) {
  const router = useRouter()
  const [sections, setSections] = useState(initialSections)
  const [pending, startTransition] = useTransition()

  useEffect(() => { setSections(initialSections) }, [initialSections])

  function handleAssignTeacher(sectionId: string, subjectId: string, teacherId: string) {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s
      const teacher = teachers.find(t => t.id === teacherId) ?? null
      return {
        ...s,
        sectionSubjects: s.sectionSubjects.map(ss =>
          ss.subjectId === subjectId
            ? { ...ss, teacherId: teacherId || null, teacher: teacher ? { id: teacher.id, user: { name: teacher.user.name } } : null }
            : ss
        ),
      }
    }))
    startTransition(async () => {
      try {
        if (teacherId) await assignTeacher(sectionId, subjectId, teacherId)
        router.refresh()
      } catch {
        toast.error('Failed to assign teacher')
      }
    })
  }

  function handleRemoveSubject(sectionId: string, subjectId: string) {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, sectionSubjects: s.sectionSubjects.filter(ss => ss.subjectId !== subjectId) } : s
    ))
    startTransition(async () => {
      try {
        await removeSectionSubject(sectionId, subjectId)
        toast.success('Subject removed from section')
        router.refresh()
      } catch {
        toast.error('Failed to remove subject')
        setSections(initialSections)
      }
    })
  }

  function handleAddSubject(sectionId: string, subjectId: string) {
    if (!subjectId) return
    const subject = subjects.find(s => s.id === subjectId)
    if (!subject) return
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s
      if (s.sectionSubjects.some(ss => ss.subjectId === subjectId)) return s
      return {
        ...s,
        sectionSubjects: [...s.sectionSubjects, { id: `new-${sectionId}-${subjectId}`, sectionId, subjectId, teacherId: null, subject, teacher: null }],
      }
    }))
    startTransition(async () => {
      try {
        await addSubjectToSection(sectionId, subjectId)
        router.refresh()
      } catch {
        toast.error('Failed to add subject to section')
        setSections(initialSections)
      }
    })
  }

  if (sections.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">No sections yet. Create sections in the Sections tab first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {sections.map(section => {
        const assignedIds = new Set(section.sectionSubjects.map(ss => ss.subjectId))
        const unassigned = subjects.filter(s => !assignedIds.has(s.id))

        return (
          <div key={section.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-foreground">{section.name}</h3>
              <Badge variant="secondary">{section.gradeLevel}</Badge>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Subject</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Assigned Teacher</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {section.sectionSubjects.map(ss => (
                    <tr key={ss.subjectId}>
                      <td className="px-5 py-3 text-foreground">{ss.subject.name}</td>
                      <td className="px-5 py-3">
                        <select
                          value={ss.teacherId ?? ''}
                          onChange={e => handleAssignTeacher(section.id, ss.subjectId, e.target.value)}
                          disabled={pending}
                          className="text-sm text-foreground border border-border rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer"
                        >
                          <option value="">— Unassigned —</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.user.name ?? t.user.email}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleRemoveSubject(section.id, ss.subjectId)}
                          disabled={pending}
                          className="text-xs text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-30 cursor-pointer"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {section.sectionSubjects.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-6 text-center text-sm text-muted-foreground">No subjects assigned.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {unassigned.length > 0 && (
              <select
                defaultValue=""
                onChange={e => { if (e.target.value) { handleAddSubject(section.id, e.target.value); e.target.value = '' } }}
                disabled={pending}
                className="text-sm text-foreground border border-border rounded-md px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer"
              >
                <option value="">+ Add subject…</option>
                {unassigned.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
        )
      })}
    </div>
  )
}
