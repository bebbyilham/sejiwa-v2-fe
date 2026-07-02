"use client";

import React, { useState, useEffect } from "react";
import {
  Row, Col, Card, Table, Tag, DatePicker, Select, Button, Space, Typography,
  Modal, Form, Input, Statistic, Avatar, Divider, App
} from "antd";
import {
  SearchOutlined, PlusOutlined, UserAddOutlined, CalendarOutlined,
  MedicineBoxOutlined, InfoCircleOutlined, UserOutlined, EyeOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

interface QueueItem {
  id: number;
  norm: string;
  nomorantrean: string;
  angkaantrean: number;
  kodepoli: string;
  statusantrean: number;
  tanggalperiksa: string;
  nama_pasien?: string; // mapped locally or via detail
}

interface BedSummary {
  total_capacity: number;
  total_available: number;
  total_occupied: number;
}

interface BedItem {
  id_bed_available: number;
  namaruang: string;
  namakelas: string;
  kapasitas: number;
  tersedia: number;
}

interface DoctorItem {
  id_pegawai: number;
  nama_pegawai: string;
  schedules?: any[];
}

export default function AntreanPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [patientsMap, setPatientsMap] = useState<Record<string, string>>({}); // no_mr -> nama_pasien
  const [bedsSummary, setBedsSummary] = useState<BedSummary | null>(null);
  const [beds, setBeds] = useState<BedItem[]>([]);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [loadingQueues, setLoadingQueues] = useState(false);
  const [loadingSidebar, setLoadingSidebar] = useState(false);

  // Filters
  const [selectedPoli, setSelectedPoli] = useState<string>("INT"); // Default Penyakit Dalam
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [poliOptions, setPoliOptions] = useState<any[]>([]);

  useEffect(() => {
    const fetchPoli = async () => {
      try {
        const res = await apiRequest("poli");
        if (res.status && res.data) {
          // Deduplicate by kode_ruangan to prevent React key duplication errors
          const uniqueData = res.data.filter(
            (item: any, index: number, self: any[]) =>
              item.kode_ruangan &&
              self.findIndex((t) => t.kode_ruangan === item.kode_ruangan) === index
          );
          setPoliOptions(uniqueData);
          // Auto select first poli if selectedPoli is empty or we want to default to the first one available
          if (uniqueData.length > 0 && !uniqueData.some((p: any) => p.kode_ruangan === selectedPoli)) {
            setSelectedPoli(uniqueData[0].kode_ruangan);
          }
        }
      } catch (e) {
        console.error("Gagal memuat poliklinik:", e);
      }
    };
    fetchPoli();
  }, []);

  // Register Queue Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [patientOptions, setPatientOptions] = useState<any[]>([]);
  const [submittingQueue, setSubmittingQueue] = useState(false);

  // Fetch Queue list and details
  const fetchQueues = async () => {
    setLoadingQueues(true);
    try {
      const data = await apiRequest(`antrian?tanggal=${selectedDate}&poli=${selectedPoli}`);
      if (data.status) {
        setQueues(data.data);
        
        // Fetch patient names for these MRs if not already fetched
        const mrs = data.data.map((q: QueueItem) => q.norm).filter((mr: string) => !patientsMap[mr]);
        if (mrs.length > 0) {
          const newMap = { ...patientsMap };
          await Promise.all(
            mrs.map(async (mr: string) => {
              try {
                const detail = await apiRequest(`pasien/detail/${mr}`);
                if (detail.status && detail.data) {
                  newMap[mr] = detail.data.nama_pasien;
                }
              } catch (e) {
                newMap[mr] = "Pasien Tidak Ditemukan";
              }
            })
          );
          setPatientsMap(newMap);
        }
      }
    } catch (e: any) {
      message.error("Gagal memuat daftar antrean: " + e.message);
    } finally {
      setLoadingQueues(false);
    }
  };

  // Fetch Beds and Doctors schedules
  const fetchSidebarData = async () => {
    setLoadingSidebar(true);
    try {
      const kamarRes = await apiRequest("kamar");
      if (kamarRes.status) {
        setBedsSummary(kamarRes.summary);
        setBeds(kamarRes.data);
      }

      const dokterRes = await apiRequest("dokter");
      if (dokterRes.status) {
        setDoctors(dokterRes.data);
      }
    } catch (e: any) {
      console.error("Gagal memuat info kapasitas bed / jadwal dokter: ", e);
    } finally {
      setLoadingSidebar(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, [selectedPoli, selectedDate]);

  useEffect(() => {
    fetchSidebarData();
  }, []);

  // Search Patient for registration
  const handleSearchPatient = async (query: string) => {
    if (!query || query.length < 3) {
      setPatientOptions([]);
      return;
    }
    setSearchingPatients(true);
    try {
      const res = await apiRequest(`pasien?search=${query}&limit=10`);
      if (res.status && res.data) {
        setPatientOptions(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearchingPatients(false);
    }
  };

  // Submit Queue Booking
  const handleRegisterQueue = async (values: any) => {
    setSubmittingQueue(true);
    try {
      const res = await apiRequest("antrian/tambah", {
        method: "POST",
        body: JSON.stringify({
          no_mr: values.no_mr,
          kode_poli: values.kode_poli,
          tanggalperiksa: values.tanggal ? values.tanggal.format("YYYY-MM-DD") : selectedDate,
        }),
      });

      if (res.status) {
        message.success("Pendaftaran antrean berhasil!");
        setIsModalOpen(false);
        form.resetFields();
        fetchQueues();
      } else {
        message.error(res.message || "Pendaftaran gagal.");
      }
    } catch (e: any) {
      message.error("Pendaftaran gagal: " + e.message);
    } finally {
      setSubmittingQueue(false);
    }
  };

  const getStatusTag = (status: number) => {
    switch (status) {
      case 1:
        return <Tag color="blue">Menunggu</Tag>;
      case 2:
        return <Tag color="orange">Asesmen</Tag>;
      case 3:
        return <Tag color="green">Pemeriksaan Dokter</Tag>;
      case 4:
        return <Tag color="cyan">Terdaftar</Tag>;
      default:
        return <Tag color="default">Selesai</Tag>;
    }
  };

  // Table Columns
  const columns = [
    {
      title: "No. Antrean",
      dataIndex: "nomorantrean",
      key: "nomorantrean",
      width: 130,
      render: (text: string) => <Text strong style={{ color: "#1890ff", fontSize: 15 }}>{text}</Text>,
    },
    {
      title: "No. RM",
      dataIndex: "norm",
      key: "norm",
      width: 110,
      render: (text: string) => <Tag color="geekblue">{text}</Tag>,
    },
    {
      title: "Nama Pasien",
      dataIndex: "norm",
      key: "nama_pasien",
      render: (norm: string) => <Text strong>{patientsMap[norm] || "Memuat..."}</Text>,
    },
    {
      title: "Status",
      dataIndex: "statusantrean",
      key: "statusantrean",
      width: 140,
      render: (status: number) => getStatusTag(status),
    },
    {
      title: "Aksi Medis",
      key: "action",
      width: 250,
      render: (_: any, record: QueueItem) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            size="middle"
            onClick={() => router.push(`/rme/${record.norm}/asesmen`)}
            style={{ background: "#52c41a", borderColor: "#52c41a" }}
          >
            Asesmen
          </Button>
          <Button
            type="primary"
            icon={<MedicineBoxOutlined />}
            size="middle"
            onClick={() => router.push(`/rme/${record.norm}/soap`)}
          >
            SOAP
          </Button>
          <Button
            shape="circle"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/rme/${record.norm}/riwayat`)}
            title="Riwayat"
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[24, 24]}>
        {/* main area - antrean list */}
        <Col xs={24} lg={17}>
          <Card
            title={
              <Space style={{ display: "flex", justifyContent: "space-between", width: "100%", flexWrap: "wrap" }}>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                  <CalendarOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                  Daftar Antrean Hari Ini
                </Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalOpen(true)}
                  style={{ background: "linear-gradient(90deg, #1890ff 0%, #096dd9 100%)", border: "none" }}
                >
                  Pendaftaran Antrean
                </Button>
              </Space>
            }
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
          >
            {/* Filter controls */}
            <div style={{ marginBottom: 20, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <span style={{ marginRight: 8, fontWeight: 500 }}>Poliklinik:</span>
                <Select
                  value={selectedPoli}
                  onChange={(val) => setSelectedPoli(val)}
                  style={{ width: 220 }}
                  size="middle"
                  showSearch
                  optionFilterProp="children"
                >
                  {poliOptions.map((poli) => (
                    <Option key={poli.kode_ruangan} value={poli.kode_ruangan}>
                      {poli.nama_ruangan} ({poli.kode_ruangan})
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <span style={{ marginRight: 8, fontWeight: 500 }}>Tanggal:</span>
                <DatePicker
                  value={dayjs(selectedDate)}
                  onChange={(date) => {
                    if (date) setSelectedDate(date.format("YYYY-MM-DD"));
                  }}
                  allowClear={false}
                  size="middle"
                />
              </div>

              <Button
                type="dashed"
                onClick={() => {
                  fetchQueues();
                  fetchSidebarData();
                }}
                style={{ marginLeft: "auto" }}
              >
                Refresh Data
              </Button>
            </div>

            <Table
              dataSource={queues}
              columns={columns}
              rowKey="id"
              loading={loadingQueues}
              pagination={{ pageSize: 8 }}
              style={{ overflowX: "auto" }}
            />
          </Card>
        </Col>

        {/* sidebar area - info & stats */}
        <Col xs={24} lg={7}>
          <Space orientation="vertical" size="large" style={{ width: "100%" }}>
            {/* Bed availability stats */}
            <Card
              title={<span style={{ fontWeight: 700 }}><InfoCircleOutlined style={{ color: "#52c41a", marginRight: 6 }} />Kapasitas Rawat Inap</span>}
              variant="borderless"
              style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
              loading={loadingSidebar}
            >
              {bedsSummary && (
                <Row gutter={12} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Statistic title="Kapasitas" value={bedsSummary.total_capacity} styles={{ content: { color: "var(--text-primary)" } }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Terisi" value={bedsSummary.total_occupied} styles={{ content: { color: "#cf1322" } }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Tersedia" value={bedsSummary.total_available} styles={{ content: { color: "#52c41a" } }} />
                  </Col>
                </Row>
              )}
              <Divider style={{ margin: "12px 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {beds.slice(0, 4).map((item) => (
                  <div key={item.id_bed_available} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border-divider)" }}>
                    <div>
                      <Text strong style={{ fontSize: 13, color: "var(--text-primary)" }}>{item.namaruang}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11, color: "var(--text-secondary)" }}>Kelas {item.namakelas}</Text>
                    </div>
                    <Tag color={item.tersedia > 0 ? "green" : "red"}>
                      {item.tersedia} Kosong
                    </Tag>
                  </div>
                ))}
              </div>
            </Card>

            {/* Doctor schedules */}
            <Card
              title={<span style={{ fontWeight: 700 }}><UserOutlined style={{ color: "#1890ff", marginRight: 6 }} />Dokter Jaga & Jadwal</span>}
              variant="borderless"
              style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
              loading={loadingSidebar}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {doctors.slice(0, 5).map((item) => (
                  <div key={item.id_pegawai} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid var(--border-divider)" }}>
                    <Avatar src="default.jpg" icon={<UserOutlined />} />
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 13, display: "block", color: "var(--text-primary)" }}>{item.nama_pegawai}</Text>
                      {item.schedules && item.schedules.length > 0 ? (
                        <div style={{ fontSize: 11, marginTop: 4 }}>
                          {item.schedules.map((s: any, idx: number) => (
                            <Tag color="cyan" key={idx} style={{ margin: "2px 2px 2px 0" }}>
                              {s.dokter_nama_poliklinik} ({s.jam_mulai} - {s.jam_selesai})
                            </Tag>
                          ))}
                        </div>
                      ) : (
                        <Text type="secondary" style={{ fontSize: 11, color: "var(--text-secondary)" }}>Jadwal tidak tersedia hari ini</Text>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* Modal Pendaftaran Antrean */}
      <Modal
        title={<strong>Pendaftaran Antrean Pasien Baru</strong>}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setPatientOptions([]);
        }}
        footer={null}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleRegisterQueue} style={{ marginTop: 16 }}>
          <Form.Item
            label="Cari Pasien (Ketik minimal 3 huruf Nama, NIK atau No. MR)"
            name="search_pasien"
          >
            <Select
              showSearch
              placeholder="Ketik nama atau No. MR pasien..."
              defaultActiveFirstOption={false}
              suffixIcon={null}
              filterOption={false}
              onSearch={handleSearchPatient}
              onChange={(value, option: any) => {
                if (value) {
                  form.setFieldsValue({ no_mr: value });
                }
              }}
              notFoundContent={searchingPatients ? "Mencari pasien..." : "Pasien tidak ditemukan"}
              style={{ width: "100%" }}
            >
              {patientOptions.map((p) => (
                <Option key={p.no_mr} value={p.no_mr}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{p.nama_pasien}</strong>
                    <span style={{ color: "#1890ff" }}>RM: {p.no_mr}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(0,0,0,0.45)" }}>
                    Lahir: {p.tanggal_lahir} | NIK: {p.nomor_pengenal || "-"} | BPJS: {p.no_bpjs || "-"}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Hidden Form Item to store selected no_mr */}
          <Form.Item
            name="no_mr"
            rules={[{ required: true, message: "Silakan pilih pasien dari hasil pencarian di atas!" }]}
          >
            <Input placeholder="No. Rekam Medis terpilih..." readOnly prefix={<SearchOutlined />} />
          </Form.Item>

          <Form.Item
            label="Pilih Poliklinik Tujuan"
            name="kode_poli"
            initialValue="INT"
            rules={[{ required: true }]}
          >
            <Select showSearch optionFilterProp="children">
              {poliOptions.map((poli) => (
                <Option key={poli.kode_ruangan} value={poli.kode_ruangan}>
                  {poli.nama_ruangan} ({poli.kode_ruangan})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Tanggal Periksa"
            name="tanggal"
            initialValue={dayjs(selectedDate)}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item style={{ display: "flex", justifyContent: "flex-end", marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="primary" htmlType="submit" loading={submittingQueue}>
                Daftarkan Pasien
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
