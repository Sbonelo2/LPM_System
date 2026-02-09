import { useState } from 'react'
import './App.css'
import DataTable from './components/DataTables'

function App() {

  return (
    <>
      <DataTable columns={[]} data={[]} loading={true} />
    </>
  )
}

export default App
