"use client";

import Link from "next/link";
import {
  type DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronRight,
  Edit,
  FolderTree,
  GripVertical,
  PackageSearch,
  Plus,
  Trash2,
} from "lucide-react";

import type { CategoryNode } from "@/components/admin/catalog/categories/category-types";

type ParentPath = string[];

type FlatCategoryRow = {
  category: CategoryNode;
  categoryKey: string;
  depth: number;
  parentPath: ParentPath;
  animationIndex: number;
};

type DraggedCategory = {
  categoryKey: string;
  parentPath: ParentPath;
};

type DropPosition = "before" | "after";

type DropTarget = {
  categoryKey: string;
  parentPath: ParentPath;
  position: DropPosition;
};

type ReorderResult = {
  nextTree: CategoryNode[];
  reorderedSiblings: CategoryNode[];
};

function getCategoryIsActive(category: CategoryNode) {
  return category.isActive !== false;
}

function getCategoryKey(category: CategoryNode) {
  return String(category.id || category.slug || "").trim();
}

function areParentPathsEqual(
  left: ParentPath,
  right: ParentPath,
) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (value, index) => value === right[index],
  );
}

function normalizeSiblingSortOrders(
  categories: CategoryNode[],
) {
  return categories.map((category, index) => ({
    ...category,
    sortOrder: index + 1,
  }));
}

function reorderSiblingArray({
  siblings,
  sourceKey,
  targetKey,
  position,
}: {
  siblings: CategoryNode[];
  sourceKey: string;
  targetKey: string;
  position: DropPosition;
}) {
  const sourceIndex = siblings.findIndex(
    (category) => getCategoryKey(category) === sourceKey,
  );

  if (sourceIndex === -1) {
    return siblings;
  }

  const nextSiblings = [...siblings];
  const [movedCategory] = nextSiblings.splice(
    sourceIndex,
    1,
  );

  const targetIndexAfterRemoval =
    nextSiblings.findIndex(
      (category) =>
        getCategoryKey(category) === targetKey,
    );

  if (targetIndexAfterRemoval === -1) {
    return siblings;
  }

  const insertionIndex =
    position === "after"
      ? targetIndexAfterRemoval + 1
      : targetIndexAfterRemoval;

  nextSiblings.splice(
    insertionIndex,
    0,
    movedCategory,
  );

  return normalizeSiblingSortOrders(nextSiblings);
}

function reorderTreeAtParentPath({
  categories,
  parentPath,
  sourceKey,
  targetKey,
  position,
}: {
  categories: CategoryNode[];
  parentPath: ParentPath;
  sourceKey: string;
  targetKey: string;
  position: DropPosition;
}): ReorderResult | null {
  if (parentPath.length === 0) {
    const reorderedSiblings = reorderSiblingArray({
      siblings: categories,
      sourceKey,
      targetKey,
      position,
    });

    return {
      nextTree: reorderedSiblings,
      reorderedSiblings,
    };
  }

  const [currentParentKey, ...remainingPath] =
    parentPath;

  let reorderedSiblings: CategoryNode[] | null =
    null;

  const nextTree = categories.map((category) => {
    if (
      getCategoryKey(category) !== currentParentKey
    ) {
      return category;
    }

    const childCategories = Array.isArray(
      category.children,
    )
      ? category.children
      : [];

    const nestedResult = reorderTreeAtParentPath({
      categories: childCategories,
      parentPath: remainingPath,
      sourceKey,
      targetKey,
      position,
    });

    if (!nestedResult) {
      return category;
    }

    reorderedSiblings =
      nestedResult.reorderedSiblings;

    return {
      ...category,
      children: nestedResult.nextTree,
    };
  });

  if (!reorderedSiblings) {
    return null;
  }

  return {
    nextTree,
    reorderedSiblings,
  };
}

function collectExpandableCategoryKeys(
  categories: CategoryNode[],
) {
  const keys: string[] = [];

  function walk(items: CategoryNode[]) {
    items.forEach((category) => {
      const categoryKey = getCategoryKey(category);

      if (
        categoryKey &&
        Array.isArray(category.children) &&
        category.children.length > 0
      ) {
        keys.push(categoryKey);
        walk(category.children);
      }
    });
  }

  walk(categories);

  return keys;
}

function flattenCategoryTree(
  categories: CategoryNode[],
  expandedCategoryKeys: Set<string>,
) {
  const rows: FlatCategoryRow[] = [];

  function walk(
    items: CategoryNode[],
    depth: number,
    parentPath: ParentPath,
  ) {
    items.forEach((category) => {
      const categoryKey = getCategoryKey(category);

      rows.push({
        category,
        categoryKey,
        depth,
        parentPath,
        animationIndex: rows.length,
      });

      const hasChildren =
        Array.isArray(category.children) &&
        category.children.length > 0;

      const isExpanded =
        expandedCategoryKeys.has(categoryKey);

      if (categoryKey && hasChildren && isExpanded) {
        walk(
          category.children || [],
          depth + 1,
          [...parentPath, categoryKey],
        );
      }
    });
  }

  walk(categories, 0, []);

  return rows;
}

function CategoryRow({
  row,
  isPageReady,
  draggedCategory,
  dropTarget,
  isExpanded,
  onToggle,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDeleting,
  isReordering,
}: {
 row: FlatCategoryRow;
  isPageReady: boolean;
  draggedCategory: DraggedCategory | null;
  dropTarget: DropTarget | null;
  isExpanded: boolean;
  onToggle: (categoryKey: string) => void;
  onDelete: (category: CategoryNode) => void;
  onDragStart: (
    event: DragEvent<HTMLButtonElement>,
    row: FlatCategoryRow,
  ) => void;
  onDragOver: (
    event: DragEvent<HTMLTableRowElement>,
    row: FlatCategoryRow,
  ) => void;
  onDrop: (
    event: DragEvent<HTMLTableRowElement>,
    row: FlatCategoryRow,
  ) => void;
  onDragEnd: () => void;
  isDeleting?: boolean;
  isReordering?: boolean;
}) {
  const { category, categoryKey, depth } = row;

  const active = getCategoryIsActive(category);

  const isDragged =
    draggedCategory?.categoryKey === categoryKey &&
    areParentPathsEqual(
      draggedCategory.parentPath,
      row.parentPath,
    );

  const isCurrentDropTarget =
    dropTarget?.categoryKey === categoryKey &&
    areParentPathsEqual(
      dropTarget.parentPath,
      row.parentPath,
    );

  const isDifferentParentDrag =
    Boolean(draggedCategory) &&
    !areParentPathsEqual(
      draggedCategory?.parentPath || [],
      row.parentPath,
    );

  const rowClasses = [
    "group border-b border-neutral-100",
    "transition-[opacity,transform,background-color,box-shadow] duration-200 ease-out",
    isPageReady
      ? "translate-y-0 opacity-100"
      : "translate-y-2 opacity-0",
    isDragged
      ? "relative z-20 scale-[1.008] bg-white opacity-55 shadow-[0_14px_36px_rgba(0,0,0,0.14)]"
      : "hover:bg-neutral-50/90",
    isCurrentDropTarget &&
    dropTarget?.position === "before"
      ? "shadow-[inset_0_3px_0_#2563eb]"
      : "",
    isCurrentDropTarget &&
    dropTarget?.position === "after"
      ? "shadow-[inset_0_-3px_0_#2563eb]"
      : "",
    isDifferentParentDrag
      ? "cursor-not-allowed opacity-55"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <tr
      className={rowClasses}
      style={{
        transitionDelay: isPageReady
          ? "0ms"
          : `${Math.min(row.animationIndex, 14) * 35}ms`,
      }}
      onDragOver={(event) =>
        onDragOver(event, row)
      }
      onDrop={(event) => onDrop(event, row)}
    >
      <td className="relative px-4 py-3">
        <div
          className="flex items-center gap-2"
          style={{
            paddingLeft: `${depth * 22}px`,
          }}
        >
          <button
            type="button"
            draggable={
              Boolean(categoryKey) &&
              !isDeleting &&
              !isReordering
            }
            disabled={
              !categoryKey ||
              isDeleting ||
              isReordering
            }
            onDragStart={(event) =>
              onDragStart(event, row)
            }
            onDragEnd={onDragEnd}
            className={[
              "flex h-8 w-7 shrink-0 items-center justify-center rounded-lg",
              "border border-transparent text-neutral-300",
              "transition duration-200",
              "hover:border-neutral-200 hover:bg-white hover:text-neutral-700",
              "active:cursor-grabbing",
              isDragged
                ? "cursor-grabbing border-neutral-300 bg-white text-neutral-950 shadow-sm"
                : "cursor-grab",
              isDeleting || isReordering
                ? "cursor-not-allowed opacity-35"
                : "",
            ].join(" ")}
            title="Drag to reorder"
            aria-label={`Reorder ${category.name}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>

      {category.children?.length ? (
  <button
    type="button"
    onClick={() => onToggle(categoryKey)}
    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-950"
    aria-label={
      isExpanded
        ? `Collapse ${category.name}`
        : `Expand ${category.name}`
    }
    aria-expanded={isExpanded}
    title={
      isExpanded
        ? "Hide child categories"
        : "Show child categories"
    }
  >
    <ChevronRight
      className={[
        "h-4 w-4 transition-transform duration-300 ease-out",
        isExpanded ? "rotate-90" : "rotate-0",
      ].join(" ")}
    />
  </button>
) : (
  <span className="h-7 w-7 shrink-0" />
)}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-neutral-950">
                {category.name}
              </span>

              {active ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Active
                </span>
              ) : (
                <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                  Inactive
                </span>
              )}
            </div>

            <p className="mt-0.5 truncate text-xs text-neutral-500">
              /{category.path || category.slug}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 text-sm text-neutral-600">
        {category.slug}
      </td>

      <td className="px-4 py-3 text-sm text-neutral-600">
        {category.level || depth + 1}
      </td>

      <td className="px-4 py-3 text-sm text-neutral-600">
        {category.directProductCount ?? 0}
      </td>

      <td className="px-4 py-3 text-sm text-neutral-600">
        {category.productCount ?? 0}
      </td>

      <td className="px-4 py-3">
        <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600">
          {category.sortOrder ?? 0}
        </span>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/catalog/categories/${encodeURIComponent(
              category.slug,
            )}/products`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition duration-200 hover:-translate-y-0.5 hover:bg-neutral-100 hover:shadow-sm"
            title="Manage category products"
          >
            <PackageSearch className="h-4 w-4" />
          </Link>

          <Link
            href={`/admin/catalog/categories/${encodeURIComponent(
              category.slug,
            )}/edit`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition duration-200 hover:-translate-y-0.5 hover:bg-neutral-100 hover:shadow-sm"
            title="Edit category"
          >
            <Edit className="h-4 w-4" />
          </Link>

          <button
            type="button"
            disabled={isDeleting || isReordering}
            onClick={() => onDelete(category)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-600 transition duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            title="Delete category"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function CategoryTreeTable({
  categories,
  onDelete,
  onReorder,
  isDeleting,
  isReordering,
}: {
  categories: CategoryNode[];
  onDelete: (category: CategoryNode) => void;
  onReorder: (
    nextTree: CategoryNode[],
    reorderedSiblings: CategoryNode[],
  ) => void | Promise<void>;
  isDeleting?: boolean;
  isReordering?: boolean;
}) {
  const [isPageReady, setIsPageReady] =
    useState(false);

    const [expandedCategoryKeys, setExpandedCategoryKeys] =
  useState<Set<string>>(
    () =>
      new Set(
        collectExpandableCategoryKeys(categories),
      ),
  );

const knownExpandableCategoryKeysRef = useRef<
  Set<string>
>(
  new Set(
    collectExpandableCategoryKeys(categories),
  ),
);

  const [draggedCategory, setDraggedCategory] =
    useState<DraggedCategory | null>(null);

  const [dropTarget, setDropTarget] =
    useState<DropTarget | null>(null);

 const flattenedRows = useMemo(
  () =>
    flattenCategoryTree(
      categories,
      expandedCategoryKeys,
    ),
  [categories, expandedCategoryKeys],
);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(
      () => {
        setIsPageReady(true);
      },
    );

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
  const currentExpandableKeys = new Set(
    collectExpandableCategoryKeys(categories),
  );

  setExpandedCategoryKeys((previousKeys) => {
    const nextKeys = new Set(previousKeys);
    let hasChanged = false;

    /*
     * New parent category aaye to default expanded rahe.
     */
    currentExpandableKeys.forEach((categoryKey) => {
      if (
        !knownExpandableCategoryKeysRef.current.has(
          categoryKey,
        )
      ) {
        nextKeys.add(categoryKey);
        hasChanged = true;
      }
    });

    /*
     * Deleted category ki stale accordion state remove karo.
     */
    nextKeys.forEach((categoryKey) => {
      if (!currentExpandableKeys.has(categoryKey)) {
        nextKeys.delete(categoryKey);
        hasChanged = true;
      }
    });

    knownExpandableCategoryKeysRef.current =
      currentExpandableKeys;

    return hasChanged ? nextKeys : previousKeys;
  });
}, [categories]);

function handleToggleCategory(
  categoryKey: string,
) {
  if (!categoryKey) {
    return;
  }

  setExpandedCategoryKeys((currentKeys) => {
    const nextKeys = new Set(currentKeys);

    if (nextKeys.has(categoryKey)) {
      nextKeys.delete(categoryKey);
    } else {
      nextKeys.add(categoryKey);
    }

    return nextKeys;
  });
}

  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    row: FlatCategoryRow,
  ) {
    if (
      isDeleting ||
      isReordering ||
      !row.categoryKey
    ) {
      event.preventDefault();
      return;
    }

    const nextDraggedCategory: DraggedCategory = {
      categoryKey: row.categoryKey,
      parentPath: row.parentPath,
    };

    setDraggedCategory(nextDraggedCategory);
    setDropTarget(null);

    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData(
      "application/x-shahsi-category",
      JSON.stringify(nextDraggedCategory),
    );

    event.dataTransfer.setData(
      "text/plain",
      row.categoryKey,
    );

    const rowElement =
      event.currentTarget.closest("tr");

    if (rowElement) {
      event.dataTransfer.setDragImage(
        rowElement,
        36,
        24,
      );
    }
  }

  function handleDragOver(
    event: DragEvent<HTMLTableRowElement>,
    row: FlatCategoryRow,
  ) {
    if (
      !draggedCategory ||
      isDeleting ||
      isReordering
    ) {
      return;
    }

    const sameSiblingGroup =
      areParentPathsEqual(
        draggedCategory.parentPath,
        row.parentPath,
      );

    const sameCategory =
      draggedCategory.categoryKey ===
      row.categoryKey;

    if (!sameSiblingGroup || sameCategory) {
      event.dataTransfer.dropEffect = "none";
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const rowRect =
      event.currentTarget.getBoundingClientRect();

    const rowMiddle =
      rowRect.top + rowRect.height / 2;

    const position: DropPosition =
      event.clientY < rowMiddle
        ? "before"
        : "after";

    setDropTarget((current) => {
      if (
        current?.categoryKey ===
          row.categoryKey &&
        current.position === position &&
        areParentPathsEqual(
          current.parentPath,
          row.parentPath,
        )
      ) {
        return current;
      }

      return {
        categoryKey: row.categoryKey,
        parentPath: row.parentPath,
        position,
      };
    });
  }

  async function handleDrop(
    event: DragEvent<HTMLTableRowElement>,
    row: FlatCategoryRow,
  ) {
    event.preventDefault();

    if (
      !draggedCategory ||
      isDeleting ||
      isReordering
    ) {
      handleDragEnd();
      return;
    }

    const sameSiblingGroup =
      areParentPathsEqual(
        draggedCategory.parentPath,
        row.parentPath,
      );

    const sameCategory =
      draggedCategory.categoryKey ===
      row.categoryKey;

    if (!sameSiblingGroup || sameCategory) {
      handleDragEnd();
      return;
    }

    const position =
      dropTarget?.categoryKey ===
        row.categoryKey &&
      areParentPathsEqual(
        dropTarget.parentPath,
        row.parentPath,
      )
        ? dropTarget.position
        : "before";

    const reorderResult =
      reorderTreeAtParentPath({
        categories,
        parentPath:
          draggedCategory.parentPath,
        sourceKey:
          draggedCategory.categoryKey,
        targetKey: row.categoryKey,
        position,
      });

    handleDragEnd();

    if (!reorderResult) {
      return;
    }

    await onReorder(
      reorderResult.nextTree,
      reorderResult.reorderedSiblings,
    );
  }

  function handleDragEnd() {
    setDraggedCategory(null);
    setDropTarget(null);
  }

  if (!categories.length) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
          <FolderTree className="h-6 w-6 text-neutral-500" />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-neutral-950">
          No categories found
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Dynamic category tree empty hai. New category create karo.
        </p>

        <Link
          href="/admin/catalog/categories/new"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Create category
        </Link>
      </div>
    );
  }

  return (
    <div
      data-product-section
      className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-neutral-200 transition-shadow duration-300 hover:shadow-md"
      onDragLeave={(event) => {
        const nextElement =
          event.relatedTarget as Node | null;

        if (
          nextElement &&
          event.currentTarget.contains(nextElement)
        ) {
          return;
        }

        setDropTarget(null);
      }}
    >
      <div className="border-b border-neutral-100 bg-neutral-50/70 px-4 py-2.5">
        <p className="text-xs text-neutral-500">
          <span className="font-semibold text-neutral-800">
            Drag handle
          </span>{" "}
          pakadkar categories ka sequence arrange
          karo. Category sirf apne sibling group
          ke andar move hogi.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1020px] border-collapse text-left">
          <thead className="bg-neutral-50">
            <tr className="border-b border-neutral-200 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
              <th className="px-4 py-3">
                Category
              </th>

              <th className="px-4 py-3">
                Slug
              </th>

              <th className="px-4 py-3">
                Level
              </th>

              <th className="px-4 py-3">
                Direct products
              </th>

              <th className="px-4 py-3">
                Total products
              </th>

              <th className="px-4 py-3">
                Sort
              </th>

              <th className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {flattenedRows.map((row) => (
              <CategoryRow
                key={`${row.parentPath.join(
                  "/",
                )}:${row.categoryKey}`}
                row={row}
                isPageReady={isPageReady}
                draggedCategory={draggedCategory}
                dropTarget={dropTarget}
                isExpanded={expandedCategoryKeys.has(
  row.categoryKey,
)}
onToggle={handleToggleCategory}
                onDelete={onDelete}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDeleting={isDeleting}
                isReordering={isReordering}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}