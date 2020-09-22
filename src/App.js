import React from 'react';
import {
  BrowserRouter as Router,
  useHistory,
  Switch,
  Route,
  Redirect,
  useRouteMatch
} from 'react-router-dom';
import {
  useRecoilState,
  useRecoilValue,
  atom
} from 'recoil';
import {
  format
} from 'date-fns';
import {
  id
} from 'date-fns/locale';

const userAtom = atom({
  key: 'userState',
  default: {
    nama: '',
    kelas: '',
    jurusan: ''
  }
})

const todayAtom = atom({
  key: 'todayState',
  default: new Date()
})

const jadwalListAtom = atom({
  key: 'jadwalListState',
  default: []
})

const sapListAtom = atom({
  key: 'sapListState',
  default: []
})

const staffListAtom = atom({
  key: 'staffListState',
  default: []
})

function App() {
  const user = useRecoilValue(userAtom)
  return (
    <Router>
      <Switch>
        <Route path='/' exact>
          <LandingPage/>
        </Route>
        <Route path="/dashboard" exact render={() => (
          user.kelas !== "" && user.jurusan !== "" && user.nama !== ""
          ? <WebApp/>
          : <Redirect to="/"/>
        )}/>
        <Route path="*">
          <Redirect to="/"/>
        </Route>
      </Switch>
    </Router>
  )
}

function WebApp() {
  let { path } = useRouteMatch()
  return (
    <Router>
      <Switch>
        <Route path={path} exact>
          <Dashboard/>
        </Route>
        <Route path="*">
          <Redirect to="/"/>
        </Route>
      </Switch>
    </Router>
  )
}

function LandingPage() {
  let history = useHistory()
  const [user, setUser] = useRecoilState(userAtom)
  const [daftarFakultas, setDaftarFakultas] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [info, setInfo] = React.useState({})

  React.useEffect(() => {
    const sessionUser = sessionStorage.getItem('user')
    const sessionUserJSON = JSON.parse(sessionUser)
    if (sessionUserJSON){
      setUser(sessionUserJSON)
      history.replace('/dashboard')
    } else {
      setLoading(true)
      fetch('http://localhost:8000/api/fakultas/')
      .then(res => res.json())
      .then(data => {
        setDaftarFakultas(data)
        setLoading(false)
      })
    }

    let namaInfo = ''
    let kelasInfo = ''
    let jurusanInfo = ''
    if (user.nama === ''){
      namaInfo = 'Nama tidak boleh kosong'
    }
    if (user.kelas === ''){
      kelasInfo = 'Kelas tidak boleh kosong'
    }
    if (user.jurusan === ''){
      jurusanInfo = 'Jurusan tidak boleh kosong'
    }
    setInfo({
      nama: namaInfo,
      kelas: kelasInfo,
      jurusan: jurusanInfo
    })
  }, [])

  const handleChange = (e) => {
    const target = e.target
    const tempUser = {...user}
    tempUser[target.id] = target.value
    setUser(tempUser)

    const tempInfo = {...info}
    if (tempUser[target.id] === ""){
      tempInfo[target.id] = `${target.id} Tidak Bisa Kosong`
    } else {
      tempInfo[target.id] = ''
    }
    setInfo(tempInfo)
  }

  const handleSubmit = (e) => {
    if (user.kelas !== "" && user.jurusan !== "" && user.nama !== ""){
      sessionStorage.setItem('user', JSON.stringify(user))
      history.replace('/dashboard')
    }
    e.preventDefault()
  }

  return (
    <main className="flex flex-col justify-center items-center h-screen">
      <h1>Data Gundar</h1>
      <form onSubmit={handleSubmit} className="bg-gray-200 p-5 flex flex-col gap-3">
        <label>Nama</label>
        <input value={user.nama} type="text" id="nama" onChange={handleChange} className="border rounded border-black capitalize"/>
        <small className="capitalize">{info.nama}</small>
        <label>Kelas</label>
        <input value={user.kelas} type="text" id="kelas" onChange={handleChange} className="border rounded border-black uppercase"/>
        <small className="capitalize">{info.kelas}</small>
        <select disabled={loading} value={user.jurusan} onChange={handleChange} id="jurusan">
          <option disabled value="">
            {loading
              ? 'Loading...'
              : 'Pilih Jurusan'
            }
          </option>
          {daftarFakultas.map(fakultas => (
            <>
            <option disabled key={fakultas.fakultasName}>{fakultas.fakultasName}</option>
            {fakultas.fakultasMajors.map(jurusan => (
              <option value={jurusan} key={jurusan}>{jurusan}</option>
            ))}
            </>
          ))}
        </select>
        <small className="capitalize">{info.jurusan}</small>
        <input className="rounded-full border border-black w-32 self-center" value="Submit" type="submit"/>
      </form>
      <span className="text-center">{info.status}</span>
    </main>
  )
}

function Dashboard(){
  const user = useRecoilValue(userAtom)
  const today = useRecoilValue(todayAtom)
  return (
    <main className="flex flex-col justify-center bg-gray-400">  
      <div className="grid justify-end mx-4 my-2">
        <span className="text-lg md:text-2xl">{format(today, 'EEEE', {locale: id})}</span>
        <span className="text-sm md:text-base">{format(today, 'd MMM yyyy', {locale: id})}</span>
      </div>
      <div className="grid mx-4">
        <span className="capitalize text-lg md:text-2xl">{user.nama}</span>
        <span className="uppercase text-sm md:text-base">{user.kelas}</span>
      </div>
      <div className="grid gap-8 rounded-lg bg-gray-300 p-5 mt-8 min-h-screen">
        <JadwalContainer user={user}/>
        <SapContainer user={user}/>
        <StaffContainer/>
      </div>
    </main>
  )
}

function JadwalContainer({user}) {
  const [today, setToday] = useRecoilState(todayAtom)
  const [jadwalList, setJadwalList] = useRecoilState(jadwalListAtom)
  const [loading, setLoading] = React.useState(false)

  const getJadwalData = (user) => {
    setLoading(true)
    setToday(new Date())
    fetch(`http://localhost:8000/api/jadwal/${user.kelas}/`)
    .then(res => res.json())
    .then(data => {
      setJadwalList(data)
      setLoading(false)
    })
    .catch(err => console.error(err))
  }

  React.useEffect(() => {
    getJadwalData(user)
  }, [])

  return(
    <div>
      <div className="grid grid-flow-col">
        <div>
          <span className="uppercase font-semibold mr-2 self-start">Kelas hari ini</span>
          <span className="font-semibold text-gray-500">({jadwalList.filter(jadwal => jadwal.jadwalHari === format(today, 'EEEE', {locale: id})).length})</span>
          {/* <svg className="inline w-4 md:w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <svg className="inline w-4 md:w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg> */}
        </div>
        <svg className="w-4 md:w-8 place-self-end cursor-pointer" onClick={() => getJadwalData(user)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      {loading
        ?<h1 className="md:text-center">Mengambil data dari server...</h1>
        : jadwalList && jadwalList.length > 0
          ?<div className="grid gap-4 mt-3 ">
            {jadwalList.filter(jadwal => jadwal.jadwalHari === format(today, 'EEEE', {locale: id})).map(jadwal => (
              <JadwalItem key={jadwal.jadwalMatkul} jadwal={jadwal}/>
            ))}
            </div>
          :<h1 className="md:text-center">Tidak ada jadwal untuk hari ini</h1>}
    </div>
  )
}

function SapContainer({user}) {
  const [sapList, setSapList] = useRecoilState(sapListAtom)
  const [loading, setLoading] = React.useState(false)

  const getSapData = (user) => {
    setLoading(true)
    fetch(`http://localhost:8000/api/sap/${user.jurusan}/`)
    .then(res => res.json())
    .then(data => {
      setSapList(data)
      setLoading(false)
    })
    .catch(err => console.error(err))
  }

  React.useEffect(() => {
    getSapData(user)
  }, [])

  return(
    <div>
      <div className="grid grid-flow-col">
        <div>
          <span className="uppercase font-semibold mr-2">SAP untuk jurusan {user.jurusan}</span>
          <span className="font-semibold text-gray-500">({sapList.filter(sap => sap.sapID !== '').length})</span>
        </div>
        <svg className="w-4 md:w-8 place-self-end cursor-pointer" onClick={() => getSapData(user)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      {loading
        ?<h1 className="md:text-center">Mengambil Data Dari Server...</h1>
        :<div className="grid gap-4 grid-cols-2 md:grid-cols-3 mt-3">
          {sapList.filter(sap => sap.sapID !== '').map(sap => (
            <SapItem key={sap.sapID} sap={sap}/>
          ))}
          </div>}
    </div>
  )
}

function StaffContainer() {
  const [staffList, setStaffList] = useRecoilState(staffListAtom)
  const [loading, setLoading] = React.useState(false)

  const getStaffData = () => {
    setLoading(true)
    fetch(`http://localhost:8000/api/staff/`)
    .then(res => res.json())
    .then(data => {
      setStaffList(data)
      setLoading(false)
    })
    .catch(err => console.error(err))
  }

  React.useEffect(() => {
    getStaffData()
  }, [])

  return(
    <div>
      <div className="grid grid-flow-col">
        <div>
          <span className="uppercase font-semibold mr-2">Daftar Staff / Dosen</span>
          <span className="font-semibold text-gray-500">({staffList.length})</span>
        </div>
        <svg className="w-4 md:w-8 place-self-end cursor-pointer" onClick={getStaffData} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      {loading
        ?<h1 className="md:text-center">Mengambil Data Dari Server...</h1>
        :<div className="grid gap-4 grid-cols-2 md:grid-cols-3 mt-3">
          {staffList.map(staff => (
            <StaffItem key={staff.staffEmail} staff={staff}/>
          ))}
          </div>}
    </div>
  )
}

function JadwalItem({jadwal}) {
  return(
    <div className="grid grid-flow-col content-center rounded-lg bg-gray-400 md:w-6/12 md:mx-auto">
      <div className="flex flex-col border-l-2 border-black p-1 m-1 md:border-none">
        <span className="ml-1 font-medium text-base md:text-center md:text-xl">{jadwal.jadwalMatkul}</span>
        <p className="ml-1 font-medium text-sm md:text-center md:text-lg">{jadwal.jadwalWaktu}</p>
        <p className="ml-4 text-xs md:text-center md:text-base">{jadwal.jadwalRuang}</p>
        <p className="ml-4 text-xs md:text-center md:text-base">{jadwal.jadwalstaff}</p>
      </div>
    </div>
  )
}

function SapItem({sap}) {
  return(
    <div className="grid grid-flow-col content-center rounded-lg bg-gray-400 md:w-6/12 md:mx-auto">
      <div className="flex flex-col border-l-2 border-black p-1 m-1 md:border-none">
        <span className="ml-1 font-medium text-base md:text-center md:text-xl">{sap.sapID}</span>
        <p className="ml-1 font-medium text-sm md:text-center md:text-lg break-words">{sap.sapTitle}</p>
      </div>
    </div>
  )
}

function StaffItem({staff}) {
  return(
    <div className="grid grid-flow-col content-center rounded-lg bg-gray-400 md:w-6/12 md:mx-auto">
      <div className="flex flex-col border-l-2 border-black p-1 m-1 md:border-none">
        <span className="ml-1 font-medium text-base md:text-center md:text-xl">{staff.staffName}</span>
        <p className="ml-1 font-medium text-sm md:text-center md:text-lg break-words">{staff.staffHomesite}</p>
        <p className="ml-1 font-medium text-sm md:text-center md:text-lg break-words">{staff.staffEmail}</p>
      </div>
    </div>
  )
}

// TODO:
// Add download link for SAP (onClick event)
// Add staff info (onClick event)
// Add managable view for SAP list

export default App;
