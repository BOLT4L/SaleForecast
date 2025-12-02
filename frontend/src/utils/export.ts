import { format } from "date-fns"

export interface ExportOptions {
  filename?: string
  format?: "csv" | "json" | "xlsx"
  includeHeaders?: boolean
}

export function exportToCSV(data: any[], options: ExportOptions = {}) {
  const { filename = "export", includeHeaders = true } = options

  if (!data.length) {
    throw new Error("No data to export")
  }

  const headers = Object.keys(data[0])
  const csvContent = []

  if (includeHeaders) {
    csvContent.push(headers.join(","))
  }

  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header]
      // Escape commas and quotes in CSV
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
    csvContent.push(values.join(","))
  })

  const csvString = csvContent.join("\n")
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })

  downloadBlob(blob, `${filename}.csv`)
}

export function exportToJSON(data: any[], options: ExportOptions = {}) {
  const { filename = "export" } = options

  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" })

  downloadBlob(blob, `${filename}.json`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  link.style.display = "none"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.URL.revokeObjectURL(url)
}

export function formatDataForExport(data: any[], type: "sales" | "products" | "forecasts" | "reports") {
  switch (type) {
    case "sales":
      return data.map((sale) => ({
        Date: format(new Date(sale.date), "yyyy-MM-dd"),
        "Total Amount": sale.totalAmount,
        "Items Count": sale.items.length,
        Promotion: sale.promotion ? "Yes" : "No",
        "Created At": format(new Date(sale.createdAt), "yyyy-MM-dd HH:mm:ss"),
      }))

    case "products":
      return data.map((product) => ({
        Name: product.name,
        Price: product.price,
        Description: product.description,
        "Created At": format(new Date(product.createdAt), "yyyy-MM-dd HH:mm:ss"),
      }))

    case "forecasts":
      return data.map((forecast) => ({
        Period: forecast.period,
        Model: forecast.model,
        "Start Date": format(new Date(forecast.startDate), "yyyy-MM-dd"),
        "End Date": format(new Date(forecast.endDate), "yyyy-MM-dd"),
        "Confidence Level": `${forecast.confidenceLevel}%`,
        "Created At": format(new Date(forecast.createdAt), "yyyy-MM-dd HH:mm:ss"),
      }))

    default:
      return data
  }
}
