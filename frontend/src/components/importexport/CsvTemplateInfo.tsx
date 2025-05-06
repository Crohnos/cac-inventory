// No imports needed

const CsvTemplateInfo = () => {
  const sampleCsvContent = `categoryName,sizeName,condition,location,receivedDate,donorInfo,approxPrice,isActive
Clothing,M,New,McKinney,2023-01-15,John Doe,10.50,Yes
Toys,,Gently Used,Plano,2023-01-20,Jane Smith,,Yes
Books,Children's,New,McKinney,2023-01-25,,,Yes`

  const csvFields = [
    { name: 'categoryName', description: 'Category name (required)', example: 'Clothing' },
    { name: 'sizeName', description: 'Size name (optional)', example: 'S, M, L, XL, 2T, etc.' },
    { name: 'condition', description: 'Item condition (New, Gently Used, Heavily Used)', example: 'New' },
    { name: 'location', description: 'Item location (McKinney or Plano)', example: 'McKinney' },
    { name: 'receivedDate', description: 'Date received (YYYY-MM-DD format)', example: '2023-01-15' },
    { name: 'donorInfo', description: 'Donor information (optional)', example: 'John Doe' },
    { name: 'approxPrice', description: 'Approximate price (optional)', example: '10.50' },
    { name: 'isActive', description: 'Item is active (Yes/No)', example: 'Yes' }
  ]

  return (
    <div>
      <h3>CSV Format Requirements</h3>
      <p>Your CSV file should include the following columns:</p>
      
      <table>
        <thead>
          <tr>
            <th>Column Name</th>
            <th>Description</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          {csvFields.map((field, index) => (
            <tr key={index}>
              <td><code>{field.name}</code></td>
              <td>{field.description}</td>
              <td><code>{field.example}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <h4 className="mt-1">Sample CSV Content</h4>
      <pre
        style={{
          backgroundColor: 'var(--code-background-color)',
          padding: '1rem',
          borderRadius: '0.25rem',
          overflowX: 'auto',
          fontSize: '0.9rem',
          fontFamily: 'monospace'
        }}
      >
        {sampleCsvContent}
      </pre>
      
      <h4 className="mt-1">Notes</h4>
      <ul>
        <li>The first row must contain the column headers as shown above.</li>
        <li>The <code>categoryName</code> field is required and will create a new category if it doesn't exist.</li>
        <li>The <code>sizeName</code> field is optional. If provided and doesn't exist, it will be created and associated with the category.</li>
        <li>Dates must be in YYYY-MM-DD format (e.g., 2023-01-15).</li>
        <li>For <code>isActive</code>, use "Yes", "True", or "1" for active items; "No", "False", or "0" for inactive items.</li>
        <li>Empty fields will be treated as null or default values.</li>
      </ul>
    </div>
  )
}

export default CsvTemplateInfo