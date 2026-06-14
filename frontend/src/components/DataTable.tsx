"use client"

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu, DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { DataTablePagination } from "./data-table-helpers/DataTablePagination"
import DateInput from "./Forms/DateInput"
import SelectInput from "./Forms/SelectInput"
import NumberInput from "./Forms/NumberInput"
import { IconFile, IconPrinter, IconSearch, IconDownload } from "@tabler/icons-react"
import { Download, FileText, Code } from "react-feather"
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import ReactDOMServer from 'react-dom/server'
import { toast } from "sonner"
import { BRANDING } from "@/config/branding"

export type DataTableFilterType = 'text' | 'select' | 'date' | 'number';

export interface DataTableFilterConfig {
    id: string;
    title: string;
    type: DataTableFilterType;
    options?: { label: string; value: any }[]; // For select filters
    placeholder?: string;
}

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    filters?: DataTableFilterConfig[]
    heading?: string
    showExportButton?: boolean
    exportFunction?: (format: 'csv' | 'pdf' | 'json' | 'excel') => Promise<void>
    onTableInstance?: (table: any) => void
    onSelectionChange?: (selectedRows: TData[]) => void
}

export function DataTable<TData, TValue>({
    columns,
    data,
    filters = [],
    heading = "",
    showExportButton = false,
    exportFunction,
    onTableInstance,
    onSelectionChange,
}: DataTableProps<TData, TValue>) {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})
    const [columnSizing, setColumnSizing] = useState({})
    const [isExporting, setIsExporting] = useState(false)

    // Utility to extract text from React elements
    const extractTextFromElement = (element: any): string => {
        if (React.isValidElement(element)) {
            const html = ReactDOMServer.renderToStaticMarkup(element);
            const div = document.createElement('div');
            div.innerHTML = html;
            return div.textContent || div.innerText || '';
        }
        return String(element);
    };

    // Extract readable value from any data type
    const extractReadableValue = (value: any): string => {
        if (value === null || value === undefined) return '';
        if (React.isValidElement(value)) {
            return extractTextFromElement(value);
        }
        if (Array.isArray(value)) {
            return value.map((item) => extractReadableValue(item)).join(', ');
        }
        if (typeof value === 'object') {
            if ('name' in value) return String(value.name);
            if ('title' in value) return String(value.title);
            if ('id' in value) return String(value.id);
            try {
                return JSON.stringify(value, null, 2).slice(0, 100);
            } catch {
                return '[Complex Object]';
            }
        }
        return String(value);
    };

    // Prepare data for export
    const prepareExportData = () => {
        const visibleColumns = table.getVisibleLeafColumns().filter(col => col.id !== 'actions' && col.id !== 'select');
        const filteredRows = table.getFilteredRowModel().rows || [];

        return filteredRows.map(row => {
            const exportRow: Record<string, any> = {};
            visibleColumns.forEach(col => {
                const cellValue = row.getValue(col.id);
                const headerLabel = typeof col.columnDef.header === 'string'
                    ? col.columnDef.header
                    : (col.columnDef as any).title || col.id;

                exportRow[headerLabel] = extractReadableValue(cellValue);
            });
            return exportRow;
        });
    };

    // Helper: Load an image URL and convert to data URL usable by jsPDF and Print
    const fetchLogoDataUrl = async (url: string): Promise<string | null> => {
        try {
            const resp = await fetch(url, { cache: 'no-store' });
            if (!resp.ok) return null;
            const blob = await resp.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (err) {
            console.warn('Failed to load logo:', err);
            return null;
        }
    };

    const handlePrint = async () => {
        const exportData = prepareExportData();
        if (exportData.length === 0) {
            toast.error('No data available to print');
            return;
        }

        const printColumns = Object.keys(exportData[0]);
        const currentDate = new Date().toLocaleDateString('en-BW', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const logoDataUrl = await fetchLogoDataUrl(BRANDING.logoPath);
        const logoSrc = logoDataUrl || BRANDING.logoPath;

        const printContent = `
            <div class="container">
                <div class="header">
                    <div class="logo-container">
                        <img class="logo" src="${logoSrc}" alt="${BRANDING.orgName} Logo" width="70" height="70" />
                        <div class="org-details">
                            <h1 class="org-name">${BRANDING.orgName}</h1>
                            <div class="org-address">
                                ${BRANDING.addressLines.map(line => `<p>${line}</p>`).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="contact-info">
                        <p><strong>Email:</strong> ${BRANDING.email}</p>
                        <p><strong>Website:</strong> ${BRANDING.website}</p>
                        <p><strong>Tel:</strong> ${BRANDING.phone}</p>
                        ${BRANDING.tollFree ? `<p><strong>Toll Free:</strong> ${BRANDING.tollFree}</p>` : ''}
                    </div>
                </div>

                <div class="document-title">${heading || 'Report'}</div>

                <div class="document-meta">
                    <div><strong>Total Records:</strong> ${exportData.length}</div>
                    <div><strong>Date Generated:</strong> ${currentDate}</div>
                </div>

                <table>
                    <thead>
                        <tr>
                            ${printColumns.map(col => `<th>${col}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${exportData.map(row => `
                            <tr>
                                ${printColumns.map(col => `<td>${row[col] ?? ''}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="footer">
                    <p>This document is system-generated from ${BRANDING.systemName}</p>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        `;

        const printStyle = `
            <style>
                @media print {
                    body, html { height: auto; margin: 0; padding: 0; }
                    body * { visibility: hidden; }
                    .container, .container * { visibility: visible !important; }
                    .container {
                        position: absolute; left: 0; top: 0; width: 100%;
                        padding: 15px 30px; margin: 0; box-sizing: border-box;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    }
                    @page { size: A4 landscape; margin: 1.5cm; }
                    .header {
                        display: flex; justify-content: space-between; align-items: flex-start;
                        padding-bottom: 15px; border-bottom: 2px solid #0f766e; margin-bottom: 20px;
                    }
                    .logo-container { display: flex; align-items: flex-start; gap: 15px; }
                    .org-name { font-size: 22px; font-weight: 700; color: #0f766e; margin: 0 0 5px 0; }
                    .org-address { font-size: 10pt; color: #4b5563; }
                    .org-address p { margin: 0; }
                    .contact-info { text-align: right; font-size: 9.5pt; color: #4b5563; }
                    .contact-info p { margin: 0; }
                    .document-title {
                        text-align: center; font-size: 18px; font-weight: 700; margin: 25px 0 15px;
                        color: #0f766e; text-transform: uppercase;
                    }
                    .document-meta {
                        display: flex; justify-content: space-between; margin-bottom: 20px;
                        font-size: 10pt; color: #4b5563; padding: 10px 15px;
                        background-color: #f1f5f9; border-left: 4px solid #0f766e;
                    }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; }
                    th, td { padding: 10px 12px; text-align: left; border: 1px solid #e5e7eb; }
                    th { background-color: #0f766e; color: white; font-weight: 600; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                    .footer {
                        margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb;
                        font-size: 9pt; color: #6b7280; text-align: center;
                    }
                }
            </style>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>${heading || 'Report'}</title>${printStyle}</head><body>${printContent}</body></html>`);

            // Wait for logo to load
            const img = printWindow.document.querySelector('.logo') as HTMLImageElement;
            const finalizePrint = () => {
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 500);
            };

            if (img && !img.complete) {
                img.onload = finalizePrint;
                img.onerror = finalizePrint;
            } else {
                finalizePrint();
            }
        }
    };

    const handleExport = async (format: 'csv' | 'pdf' | 'json' | 'excel') => {
        const exportData = prepareExportData();
        if (exportData.length === 0) {
            toast.error('No data available to export');
            return;
        }

        setIsExporting(true);
        try {
            if (exportFunction) {
                await exportFunction(format);
            } else {
                const fileName = `${(heading || 'export').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

                if (format === 'csv') {
                    const worksheet = XLSX.utils.json_to_sheet(exportData);
                    const csv = XLSX.utils.sheet_to_csv(worksheet);
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `${fileName}.csv`);
                    link.click();
                } else if (format === 'excel') {
                    const worksheet = XLSX.utils.json_to_sheet(exportData);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
                    XLSX.writeFile(workbook, `${fileName}.xlsx`);
                } else if (format === 'json') {
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `${fileName}.json`);
                    link.click();
                } else if (format === 'pdf') {
                    const doc = new jsPDF('landscape');
                    const pageWidth = doc.internal.pageSize.getWidth();

                    // Add Branding Header (jsPDF cannot render SVG logos — skip those)
                    let logoData = await fetchLogoDataUrl(BRANDING.logoPath);
                    if (logoData?.startsWith('data:image/svg')) logoData = null;
                    let currentY = 15;

                    if (logoData) {
                        try {
                            const img = new Image();
                            img.src = logoData;
                            await new Promise((res) => { img.onload = res; img.onerror = res; });
                            const aspect = img.width / img.height;
                            const imgH = 15;
                            const imgW = imgH * aspect;
                            doc.addImage(logoData, 'PNG', (pageWidth - imgW) / 2, currentY, imgW, imgH);
                            currentY += imgH + 5;
                        } catch (e) { console.warn('PDF Logo error', e); }
                    }

                    doc.setFontSize(16);
                    doc.setTextColor(15, 118, 110);
                    doc.text(BRANDING.orgName, pageWidth / 2, currentY, { align: 'center' });
                    currentY += 7;

                    doc.setFontSize(10);
                    doc.setTextColor(100, 116, 139);
                    doc.text(BRANDING.addressLines.join(', '), pageWidth / 2, currentY, { align: 'center' });
                    currentY += 5;
                    doc.text(`Email: ${BRANDING.email} | Website: ${BRANDING.website} | Tel: ${BRANDING.phone}`, pageWidth / 2, currentY, { align: 'center' });
                    currentY += 10;

                    doc.setFontSize(14);
                    doc.setTextColor(15, 118, 110);
                    doc.text(heading || 'Data Report', pageWidth / 2, currentY, { align: 'center' });
                    currentY += 10;

                    const headers = [Object.keys(exportData[0])];
                    const body = exportData.map(row => Object.values(row));

                    autoTable(doc, {
                        head: headers,
                        body: body,
                        startY: currentY,
                        styles: { fontSize: 8 },
                        headStyles: { fillColor: [15, 118, 110] },
                    });

                    // Add Page Numbers
                    const pageCount = doc.getNumberOfPages();
                    for (let i = 1; i <= pageCount; i++) {
                        doc.setPage(i);
                        doc.setFontSize(8);
                        doc.setTextColor(100, 116, 139);
                        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10);
                    }

                    doc.save(`${fileName}.pdf`);
                }
            }
            toast.success(`Exported as ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error(`Failed to export as ${format.toUpperCase()}`);
        } finally {
            setIsExporting(false);
        }
    };

    const table = useReactTable({
        data: data || [],
        columns,
        columnResizeMode: 'onChange',
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onColumnSizingChange: setColumnSizing,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            columnSizing,
        },
    })

    React.useEffect(() => {
        if (onTableInstance) {
            onTableInstance(table);
        }
    }, [table, onTableInstance]);

    // Fire onSelectionChange only when row selection state actually changes
    React.useEffect(() => {
        if (onSelectionChange) {
            const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original as TData);
            onSelectionChange(selectedRows);
        }
    }, [rowSelection]);


    return (
        <div>
            <div className="flex items-center py-4 justify-between">
                {heading && <h2 className="text-xl font-bold text-green-700">{heading}</h2>}
                <div className="flex gap-2 ml-auto">
                    {showExportButton && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex gap-2 border-green-600 text-green-600 hover:bg-green-50">
                                    <IconDownload className="h-4 w-4" />
                                    Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-gray-200">
                                <DropdownMenuItem onClick={() => handleExport('excel')}>
                                    <IconFile className="mr-2 h-4 w-4" />
                                    <span>Export to Excel</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('csv')}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Export to CSV</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                    <IconFile className="mr-2 h-4 w-4" />
                                    <span>Export to PDF</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('json')}>
                                    <Code className="mr-2 h-4 w-4" />
                                    <span>Export to JSON</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handlePrint}>
                                    <IconPrinter className="mr-2 h-4 w-4" />
                                    <span>Print Report</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-200">
                            {table
                                .getAllColumns()
                                .filter(
                                    (column) => column.getCanHide()
                                )
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize text-green-600"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="overflow-hidden rounded-md border">
                <Table className="w-full table-fixed" style={{ width: table.getCenterTotalSize() }}>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <React.Fragment key={headerGroup.id}>
                                <TableRow>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead
                                                key={header.id}
                                                style={{ width: header.getSize() }}
                                                className="relative group border-r border-gray-300"
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                {header.column.getCanResize() && (
                                                    <div
                                                        onMouseDown={header.getResizeHandler()}
                                                        onTouchStart={header.getResizeHandler()}
                                                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity ${header.column.getIsResizing() ? 'bg-green-700 opacity-100' : ''}`}
                                                    />
                                                )}
                                            </TableHead>
                                        )
                                    })}
                                </TableRow>
                                <TableRow>
                                    {headerGroup.headers.map((header) => {
                                        const filter = filters.find(f => f.id === header.column.id);
                                        return (
                                            <TableHead
                                                key={`${header.id}-filter`}
                                                style={{ width: header.getSize() }}
                                                className="py-2 border-r border-gray-300 first:border-l"
                                            >
                                                {filter && (
                                                    <div className="min-w-[120px]">
                                                        {filter.type === 'select' && (
                                                            <SelectInput
                                                                placeholder={filter.placeholder || "Filter..."}
                                                                options={filter.options || []}
                                                                value={filter.options?.find(opt => opt.value === header.column.getFilterValue()) || null}
                                                                onChange={(option: any) => header.column.setFilterValue(option?.value || undefined)}
                                                                isClearable
                                                                className="text-xs"
                                                            />
                                                        )}
                                                        {filter.type === 'date' && (
                                                            <DateInput
                                                                placeholder={filter.placeholder || "Filter..."}
                                                                value={header.column.getFilterValue() as string || ''}
                                                                onChange={(date: any) => header.column.setFilterValue(date || undefined)}
                                                                disableTime
                                                                className="h-8 text-xs"
                                                            />
                                                        )}
                                                        {filter.type === 'text' && (
                                                            <Input
                                                                placeholder={filter.placeholder || "Filter..."}
                                                                value={(header.column.getFilterValue() as string) ?? ""}
                                                                onChange={(event) =>
                                                                    header.column.setFilterValue(event.target.value)
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        )}
                                                        {filter.type === 'number' && (
                                                            <NumberInput
                                                                placeholder={filter.placeholder || "Filter..."}
                                                                value={header.column.getFilterValue() as number ?? undefined}
                                                                onChange={(event) =>
                                                                    header.column.setFilterValue(event.target.value === "" ? undefined : Number(event.target.value))
                                                                }
                                                                className="h-8 text-xs [&_input]:py-1 [&_input]:h-8"
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </TableHead>
                                        )
                                    })}
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={row.getIsSelected() ? "bg-gray-200 border-l-2 border-l-green-500" : ""}
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const meta: any = cell.column.columnDef.meta;
                                        const dynamicCellClass =
                                            typeof meta?.cellClassName === 'function'
                                                ? meta.cellClassName(row.original)
                                                : meta?.cellClassName ?? '';
                                        return (
                                        <TableCell
                                            key={cell.id}
                                            style={{ width: cell.column.getSize() }}
                                            className={`border border-gray-300 ${dynamicCellClass}`.trim()}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination table={table} />
        </div>
    )
}