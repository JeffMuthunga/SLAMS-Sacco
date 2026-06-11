"use client";

import { Button } from "@/components/ui/button";
import type { Table } from "@tanstack/react-table";

interface DataTablePaginationProps<TData> {
    table: Table<TData>;
    pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
    table,
    pageSizeOptions = [10, 20, 50, 100],
}: DataTablePaginationProps<TData>) {
    const selectedCount = table.getFilteredSelectedRowModel().rows.length;
    const totalCount = table.getFilteredRowModel().rows.length;

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="text-sm text-gray-500">
                {selectedCount > 0
                    ? `${selectedCount} of ${totalCount} row(s) selected`
                    : `${totalCount} row(s)`}
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Rows per page</span>
                    <select
                        value={table.getState().pagination.pageSize}
                        onChange={(e) => table.setPageSize(Number(e.target.value))}
                        className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-green-600"
                    >
                        {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>

                <span className="text-sm font-medium">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {Math.max(table.getPageCount(), 1)}
                </span>

                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        {"<<"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        {"<"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        {">"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        {">>"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
