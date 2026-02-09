import { useState } from 'react'
import './App.css'
import DataTable from './components/DataTables'
import LoadingSpinner from './components/LoadingSpinner'

function App() {

  return (
    <>
      {/* <DataTable columns={[]} data={[]} loading={true} /> */}
      <LoadingSpinner message="Loading data..." size="large" />
    </>
  )
}

export default App
