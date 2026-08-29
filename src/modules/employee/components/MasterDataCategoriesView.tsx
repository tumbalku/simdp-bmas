"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Award,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  FolderTree,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { generateAlphanumericKey } from "@/utils/crypto";
import { toast } from "sonner";

import { PageHeader } from "@/components/navigation/PageHeader";
import {
  CriticalActionVerificationDialog,
  type CriticalActionVerificationResult,
} from "@/components/verification/CriticalActionVerificationDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils";
import { verifyCurrentPasswordAction } from "@/modules/auth";
import { crudMasterDataAction } from "@/modules/employee";
import {
  EMPLOYEE_CATEGORY_COPY,
  EMPLOYEE_CATEGORY_TYPE_CONFIG,
  EMPLOYEE_CATEGORY_TYPE_OPTIONS,
  type EmployeeCategoryTypeConfig,
} from "@/modules/employee";

import {
  buildHierarchy,
  getParentOptions,
  setTypeItems,
  type CategoriesData,
  type CategoryMasterData,
  type CategoryType,
  type HierarchyItem,
} from "./MasterDataCategoryHelpers";

export type { CategoryMasterData } from "./MasterDataCategoryHelpers";

type EditingItem = {
  id: string;
  name: string;
  type: CategoryType;
  parentId?: string | null;
  rankName?: string | null;
  rank?: string | null;
  grade?: string | null;
};

type DeleteTarget = {
  id: string;
  name: string;
  type: CategoryType;
};

type HierarchyCardProps = {
  title: string;
  icon: typeof FolderTree;
  iconClassName: string;
  dotClassName: string;
  countLabel: string;
  emptyText: string;
  emptyChildText: string;
  items: HierarchyItem[];
  parentType: CategoryType;
  childType: CategoryType;
  onEdit: (item: EditingItem) => void;
  onDelete: (item: DeleteTarget) => void;
};

type FlatCategoryCardProps = {
  title: string;
  icon: typeof Award;
  iconClassName: string;
  countLabel: string;
  emptyText: string;
  items: CategoryMasterData[];
  type: CategoryType;
  onEdit: (item: EditingItem) => void;
  onDelete: (item: DeleteTarget) => void;
};

type MasterDataCategoriesViewProps = {
  initialData: CategoriesData;
};

const TYPE_CONFIG: Record<CategoryType, EmployeeCategoryTypeConfig> = EMPLOYEE_CATEGORY_TYPE_CONFIG;
const TYPE_OPTIONS = EMPLOYEE_CATEGORY_TYPE_OPTIONS;
const COPY = EMPLOYEE_CATEGORY_COPY;
const CATEGORY_CARD_CLASS =
  "flex h-[28rem] flex-col overflow-hidden border-muted-foreground/10 shadow-sm md:h-[calc(100vh-14rem)] md:min-h-[24rem] md:max-h-[36rem]";

function CategoryCardHeader({
  title,
  icon: Icon,
  iconClassName,
  countLabel,
}: {
  title: string;
  icon: typeof FolderTree;
  iconClassName: string;
  countLabel: string;
}) {
  return (
    <CardHeader className="border-b">
      <div className="flex items-start justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
            <Icon className={cn("size-4", iconClassName)} />
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate text-sm font-semibold text-primary">
              {title}
            </CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {countLabel}
            </p>
          </div>
        </div>
      </div>
    </CardHeader>
  );
}

function HierarchyCard({
  title,
  icon,
  iconClassName,
  dotClassName,
  countLabel,
  emptyText,
  emptyChildText,
  items,
  parentType,
  childType,
  onEdit,
  onDelete,
}: HierarchyCardProps) {
  return (
    <Card className={CATEGORY_CARD_CLASS}>
      <CategoryCardHeader
        title={title}
        icon={icon}
        iconClassName={iconClassName}
        countLabel={countLabel}
      />
      <CardContent className="min-h-0 flex-1 p-0">
        {items.length === 0 ? (
          <div className="m-3 flex h-[calc(100%-1.5rem)] min-h-[16rem] items-center justify-center rounded-lg border border-dashed bg-muted/20 p-5 text-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <div className="scrollbar-soft h-full divide-y overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="group/parent-row px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn("size-2 shrink-0 rounded-full", dotClassName)}
                    />
                    <span className="truncate text-[13px] font-medium">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 xl:opacity-0 xl:transition-opacity xl:group-hover/parent-row:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        onEdit({
                          id: item.id,
                          name: item.name,
                          type: parentType,
                        })
                      }
                      title="Edit"
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        onDelete({
                          id: item.id,
                          name: item.name,
                          type: parentType,
                        })
                      }
                      title="Hapus"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>

                <div className="mt-1.5 space-y-0.5 border-l pl-2.5">
                  {item.children.length > 0 ? (
                    item.children.map((child) => (
                      <div
                        key={child.id}
                        className="group/child-row flex items-center justify-between gap-2 rounded-md px-1.5 py-0.5 text-xs hover:bg-muted/60"
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                          <span className="truncate text-[12px] text-muted-foreground">
                            {child.name}
                          </span>
                        </span>
                        <div className="flex shrink-0 items-center gap-0.5 xl:opacity-0 xl:transition-opacity xl:group-hover/child-row:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              onEdit({
                                id: child.id,
                                name: child.name,
                                type: childType,
                                parentId: item.id,
                              })
                            }
                            title="Edit"
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              onDelete({
                                id: child.id,
                                name: child.name,
                                type: childType,
                              })
                            }
                            title="Hapus"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="px-1 py-1 text-[11px] text-muted-foreground">
                      {emptyChildText}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FlatCategoryCard({
  title,
  icon,
  iconClassName,
  countLabel,
  emptyText,
  items,
  type,
  onEdit,
  onDelete,
}: FlatCategoryCardProps) {
  return (
    <Card className={CATEGORY_CARD_CLASS}>
      <CategoryCardHeader
        title={title}
        icon={icon}
        iconClassName={iconClassName}
        countLabel={countLabel}
      />
      <CardContent className="min-h-0 flex-1 p-0">
        {items.length === 0 ? (
          <div className="m-3 flex h-[calc(100%-1.5rem)] min-h-[10rem] items-center justify-center rounded-lg border border-dashed bg-muted/20 p-5 text-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <div className="scrollbar-soft h-full divide-y overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="group/flat-row flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/50"
              >
                <span className="truncate text-[13px] font-medium">
                  {item.name}
                </span>
                <div className="flex shrink-0 items-center gap-0.5 xl:opacity-0 xl:transition-opacity xl:group-hover/flat-row:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() =>
                      onEdit({ id: item.id, name: item.name, type, rankName: item.rankName ?? item.rank, rank: item.rankName ?? item.rank, grade: item.grade })
                    }
                    title="Edit"
                  >
                    <Pencil className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-destructive hover:text-destructive"
                    onClick={() =>
                      onDelete({ id: item.id, name: item.name, type })
                    }
                    title="Hapus"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MasterDataCategoriesView({
  initialData,
}: MasterDataCategoriesViewProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedType, setSelectedType] = useState<CategoryType>("STATUS");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [rank, setRank] = useState("");
  const [grade, setGrade] = useState("");
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteSecretKey, setDeleteSecretKey] = useState("");
  const [isPending, startTransition] = useTransition();

  const employmentHierarchy = useMemo(
    () => buildHierarchy(data.employmentStatuses, data.employeeGroups),
    [data.employmentStatuses, data.employeeGroups]
  );
  const professionHierarchy = useMemo(
    () => buildHierarchy(data.professionGroups, data.employeePositions),
    [data.professionGroups, data.employeePositions]
  );

  const selectedConfig = TYPE_CONFIG[selectedType];
  const parentOptions = getParentOptions(data, selectedType);
  const requiresParent = Boolean(selectedConfig.parentField);

  const handleOpenDelete = (item: DeleteTarget) => {
    setDeleteSecretKey(generateAlphanumericKey(12));
    setDeleteTarget(item);
  };

  const openCreate = (type: CategoryType = "STATUS", initialParentId = "") => {
    setDialogMode("create");
    setEditingItem(null);
    setSelectedType(type);
    setName("");
    setParentId(initialParentId);
    setRank("");
    setGrade("");
    setDialogOpen(true);
  };

  const openEdit = (item: EditingItem) => {
    setDialogMode("edit");
    setEditingItem(item);
    setSelectedType(item.type);
    setName(item.name);
    setParentId(item.parentId ?? "");
    setRank(item.rankName ?? item.rank ?? "");
    setGrade(item.grade ?? "");
    setDialogOpen(true);
  };

  const handleSave = () => {
    const isRank = selectedType === "RANK";

    if (isRank) {
      if (!grade.trim()) {
        toast.error("Golongan wajib diisi.");
        return;
      }
    } else {
      if (!name.trim()) {
        toast.error(`${selectedConfig.fieldLabel} wajib diisi.`);
        return;
      }
    }

    if (requiresParent && !parentId) {
      toast.error(`${selectedConfig.parentLabel} wajib dipilih.`);
      return;
    }

    const payload: Record<string, string> = {};
    if (isRank) {
      payload.grade = grade.trim();
      if (rank.trim()) {
        payload.rankName = rank.trim();
      }
    } else {
      payload.name = name.trim();
    }
    if (selectedConfig.parentField) {
      payload[selectedConfig.parentField] = parentId;
    }

    startTransition(async () => {
      const result = await crudMasterDataAction(
        selectedConfig.entity,
        dialogMode === "create" ? "CREATE" : "UPDATE",
        dialogMode === "edit" ? editingItem?.id : undefined,
        payload
      );

      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      const savedItem: CategoryMasterData = {
        id: result.data.id,
        name: result.data.name,
        parentId: requiresParent ? parentId : null,
        rankName: result.data.rankName ?? result.data.rank ?? null,
        rank: result.data.rankName ?? result.data.rank ?? null,
        grade: result.data.grade ?? null,
      };

      setData((current) =>
        setTypeItems(current, selectedType, (items) => {
          if (dialogMode === "edit") {
            return items
              .map((item) => (item.id === savedItem.id ? savedItem : item))
              .sort((a, b) => a.name.localeCompare(b.name));
          }

          return [...items, savedItem].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
        })
      );

      toast.success(
        dialogMode === "create"
          ? COPY.saveCreateSuccess
          : COPY.saveUpdateSuccess
      );
      setDialogOpen(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return { ok: false, error: { message: "Data tidak ditemukan" } };

    const deletedItemName = deleteTarget.name;
    const deletedItemType = deleteTarget.type;
    const deletedItemId = deleteTarget.id;
    const config = TYPE_CONFIG[deletedItemType];

    return new Promise<CriticalActionVerificationResult>((resolve) => {
      startTransition(async () => {
        const result = await crudMasterDataAction(
          config.entity,
          "DELETE",
          deletedItemId
        );

        if (!result.ok) {
          toast.error(result.error.message);
          resolve(result);
          return;
        }

        setData((current) =>
          setTypeItems(current, deletedItemType, (items) =>
            items.filter((item) => item.id !== deletedItemId)
          )
        );
        toast.success(`Data "${deletedItemName}" berhasil dihapus.`);
        setDeleteTarget(null);
        router.refresh();
        resolve({ ok: true });
      });
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kategori"
        title={COPY.pageTitle}
        description={COPY.pageDescription}
        actions={[
          {
            label: COPY.addMaster,
            icon: <Plus className="size-3.5" />,
            onClick: () => openCreate("STATUS"),
          },
        ]}
      />

      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HierarchyCard
          title={COPY.statusAndGroup}
          icon={FolderTree}
          iconClassName="text-amber-600"
          dotClassName="bg-amber-500"
          countLabel={`${data.employmentStatuses.length} status induk - ${data.employeeGroups.length} kelompok`}
          emptyText={COPY.emptyEmploymentStatus}
          emptyChildText={COPY.emptyEmployeeGroup}
          items={employmentHierarchy}
          parentType="STATUS"
          childType="GROUP"
          onEdit={openEdit}
          onDelete={handleOpenDelete}
        />

        <HierarchyCard
          title={COPY.professionAndPosition}
          icon={BriefcaseBusiness}
          iconClassName="text-blue-600"
          dotClassName="bg-blue-500"
          countLabel={`${data.professionGroups.length} rumpun profesi - ${data.employeePositions.length} jabatan`}
          emptyText={COPY.emptyProfessionGroup}
          emptyChildText={COPY.emptyEmployeePosition}
          items={professionHierarchy}
          parentType="PROFESSION"
          childType="POSITION"
          onEdit={openEdit}
          onDelete={handleOpenDelete}
        />

        <FlatCategoryCard
          title={COPY.rankAndGrade}
          icon={Award}
          iconClassName="text-orange-600"
          countLabel={`${data.employeeRanks.length} pangkat`}
          emptyText={COPY.emptyRank}
          items={data.employeeRanks}
          type="RANK"
          onEdit={openEdit}
          onDelete={handleOpenDelete}
        />

        <FlatCategoryCard
          title={COPY.workplace}
          icon={Building2}
          iconClassName="text-emerald-600"
          countLabel={`${data.workplaces.length} tempat kerja`}
          emptyText={COPY.emptyWorkplace}
          items={data.workplaces}
          type="WORKPLACE"
          onEdit={openEdit}
          onDelete={handleOpenDelete}
        />
      </div>


      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Tambah" : "Edit"}{" "}
              {selectedConfig.label}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? COPY.createDescription
                : COPY.editDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="category-type">{COPY.typeLabel}</Label>
              <Select
                value={selectedType}
                disabled={dialogMode === "edit"}
                onValueChange={(value) => {
                  setSelectedType(value as CategoryType);
                  setParentId("");
                  setRank("");
                  setGrade("");
                }}
              >
                <SelectTrigger id="category-type" className="h-9 w-full">
                  <SelectValue placeholder={COPY.typePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {requiresParent ? (
              <div className="space-y-2">
                <Label htmlFor="category-parent">
                  {selectedConfig.parentLabel}
                </Label>
                <Select
                  value={parentId}
                  onValueChange={(value) => setParentId(value ?? "")}
                >
                  <SelectTrigger id="category-parent" className="h-9 w-full">
                    <SelectValue placeholder={`Pilih ${selectedConfig.parentLabel?.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {parentOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {selectedType === "RANK" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="category-golongan">
                    Golongan <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="category-golongan"
                    className="h-9"
                    value={grade}
                    onChange={(event) => setGrade(event.target.value)}
                    placeholder="Contoh: III-a"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-pangkat">Pangkat (opsional)</Label>
                  <Input
                    id="category-pangkat"
                    className="h-9"
                    value={rank}
                    onChange={(event) => setRank(event.target.value)}
                    placeholder="Contoh: Penata Muda"
                  />
                </div>
                {(grade.trim() || rank.trim()) && (
                  <p className="text-[12px] text-muted-foreground">
                    Label:{" "}
                    <span className="font-medium text-foreground">
                      {rank.trim() && grade.trim()
                        ? `${rank.trim()} / ${grade.trim()}`
                        : grade.trim() || rank.trim()}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="category-name">{selectedConfig.fieldLabel}</Label>
                <Input
                  id="category-name"
                  className="h-9"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={`Masukkan ${selectedConfig.fieldLabel.toLowerCase()}`}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CriticalActionVerificationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Verifikasi Hapus Data Kategori"
        description={`Tindakan ini membutuhkan verifikasi sebelum ${TYPE_CONFIG[deleteTarget?.type ?? "STATUS"].label.toLowerCase()} "${deleteTarget?.name ?? ""}" dihapus.`}
        actionLabel="Hapus Data"
        targetLabel="nama kategori"
        targetValue={deleteTarget?.name ?? ""}
        confirmationPhrase={deleteSecretKey}
        allowCopyPhrase={false}
        impacts={[
          `Data kategori "${deleteTarget?.name ?? ""}" akan dihapus permanen dari sistem.`,
          "Pastikan tidak ada data pegawai atau referensi aktif yang masih terhubung dengan kategori ini.",
          "Aksi penghapusan ini akan dicatat di audit log server.",
        ]}
        tone="destructive"
        isPending={isPending}
        onVerifyPassword={(password) => verifyCurrentPasswordAction({ password })}
        onConfirm={handleDelete}
      />
    </div>
  );
}
