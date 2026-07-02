"use client";

import React, { useState, useEffect } from "react";
import {
  Row, Col, Card, Table, Tag, DatePicker, Select, Button, Space, Typography,
  Input, App
} from "antd";
import {
  SearchOutlined, MedicineBoxOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined,
  DeleteOutlined, CheckOutlined, LoadingOutlined
} from "@ant-design/icons";
import { apiRequest } from "../../../lib/api";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;
const { Option } = Select;

interface PrescriptionItem {
  id_pasien_resep: number;
  id_kunjungan: number;
  nomor_resep: string;
  created_at: string;
  resep_manual: number;
  iterasi_resep: number;
  layanan: number;
  approval: number;
  apotik_online: number;
  tgl_resep: string;
  id_pasien: number;
  no_mr: string;
  nama_pasien: string;
  jenis_kelamin: number;
  nama_dokter: string;
  user_created_name: string | null;
  nama_poli: string | null;
  nama_ruangan_ranap: string | null;
  kode_kelas: string | null;
  ut: number;
  ub: number;
  pasien_iterasi: number;
}

export default function DaftarResepPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [data, setData] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  // Filters state
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [selectedLayanan, setSelectedLayanan] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedStatusInput, setSelectedStatusInput] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchResep = async () => {
    setLoading(true);
    try {
      let url = `farmasibpjs/resep?tanggal=${selectedDate}&layanan=${selectedLayanan}&status_resep=${selectedStatus}&status_resep_input=${selectedStatusInput}`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      const res = await apiRequest(url);
      if (res.status && res.data) {
        setData(res.data);
      } else {
        setData([]);
      }
    } catch (e: any) {
      message.error("Gagal memuat resep BPJS: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResep();
  }, [selectedDate, selectedLayanan, selectedStatus, selectedStatusInput]);

  const handleSearch = () => {
    fetchResep();
  };

  const handleFinalize = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await apiRequest("farmasibpjs/resep/final", {
        method: "POST",
        body: JSON.stringify({ id_pasien_resep: id }),
      });
      if (res.status) {
        message.success("Resep berhasil difinalkan ke BPJS");
        fetchResep();
      } else {
        message.error(res.message || "Gagal meminalkan resep");
      }
    } catch (e: any) {
      message.error("Gagal memproses aksi: " + e.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleCancel = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await apiRequest("farmasibpjs/resep/batal", {
        method: "POST",
        body: JSON.stringify({ id_pasien_resep: id }),
      });
      if (res.status) {
        message.success("Aksi berhasil dibatalkan");
        fetchResep();
      } else {
        message.error(res.message || "Gagal membatalkan resep");
      }
    } catch (e: any) {
      message.error("Gagal memproses aksi: " + e.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const getLayananText = (record: PrescriptionItem) => {
    if (record.layanan === 3) {
      return <Tag color="volcano">IGD</Tag>;
    } else if (record.layanan === 1) {
      return (
        <Space direction="vertical" size={1}>
          <Tag color="purple">Rawat Inap</Tag>
          <Text style={{ fontSize: 11 }}>
            {record.nama_ruangan_ranap} - Class {record.kode_kelas || "-"}
          </Text>
        </Space>
      );
    } else {
      return (
        <Space direction="vertical" size={1}>
          <Tag color="cyan">Rawat Jalan</Tag>
          <Text style={{ fontSize: 11 }} type="secondary">
            {record.nama_poli}
          </Text>
        </Space>
      );
    }
  };

  const columns = [
    {
      title: "No",
      key: "index",
      width: 50,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Data Resep",
      key: "data_resep",
      width: 280,
      render: (_: any, record: PrescriptionItem) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Text strong style={{ color: "var(--primary-color)" }}>
            {record.nomor_resep}
          </Text>
          {record.iterasi_resep > 0 && (
            <Tag color="warning" style={{ width: "fit-content" }}>
              Iterasi {record.iterasi_resep}x
            </Tag>
          )}
          {getLayananText(record)}
          <Text style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Dokter: <strong>{record.nama_dokter}</strong>
          </Text>
          <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            {dayjs(record.created_at).format("DD-MM-YYYY HH:mm:ss")}
          </Text>
        </div>
      ),
    },
    {
      title: "Data Pasien",
      key: "data_pasien",
      width: 280,
      render: (_: any, record: PrescriptionItem) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Text strong style={{ fontSize: 14 }}>
            {record.nama_pasien.toUpperCase()}
          </Text>
          <Space>
            <Tag color="geekblue">{record.no_mr}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.jenis_kelamin === 1 ? "Laki-laki" : "Perempuan"}
            </Text>
          </Space>
          <Text style={{ fontSize: 12 }} type="secondary">
            Usia: {record.ut} tahun {record.ub} bulan
          </Text>
        </div>
      ),
    },
    {
      title: "User Pembuat",
      dataIndex: "user_created_name",
      key: "user_created",
      width: 150,
      render: (text: string) => text || "-",
    },
    {
      title: "Status Resep BPJS",
      key: "status_bpjs",
      width: 160,
      render: (_: any, record: PrescriptionItem) => (
        record.apotik_online === 1 ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            SELESAI INPUT
          </Tag>
        ) : (
          <Tag color="red" icon={<CloseCircleOutlined />}>
            BELUM INPUT
          </Tag>
        )
      ),
    },
    {
      title: "Aksi",
      key: "action",
      width: 180,
      render: (_: any, record: PrescriptionItem) => {
        const isCurrentLoading = actionLoading[record.id_pasien_resep] || false;
        return (
          <Space size="small">
            {record.apotik_online !== 1 ? (
              <>
                <Button
                  type="primary"
                  size="middle"
                  icon={<MedicineBoxOutlined />}
                  style={{ background: "var(--primary-color)", borderColor: "var(--primary-color)" }}
                  onClick={() => router.push(`/farmasibpjs/daftarresep/proses/${record.id_pasien_resep}`)}
                >
                  Proses
                </Button>
                <Button
                  type="default"
                  size="middle"
                  onClick={() => handleFinalize(record.id_pasien_resep)}
                  disabled={isCurrentLoading}
                >
                  Final
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                danger
                size="middle"
                icon={isCurrentLoading ? <LoadingOutlined /> : <DeleteOutlined />}
                loading={isCurrentLoading}
                onClick={() => handleCancel(record.id_pasien_resep)}
              >
                Batal
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", flexWrap: "wrap", alignItems: "center" }}>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              <MedicineBoxOutlined style={{ marginRight: 8, color: "var(--primary-color)" }} />
              Daftar Resep Farmasi BPJS
            </Title>
            <Button
              type="dashed"
              icon={<ReloadOutlined />}
              onClick={fetchResep}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        }
        variant="borderless"
        style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
      >
        {/* Filter controls */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} md={4}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text strong style={{ fontSize: 12 }}>Tanggal Resep:</Text>
              <DatePicker
                value={dayjs(selectedDate)}
                onChange={(date) => {
                  if (date) setSelectedDate(date.format("YYYY-MM-DD"));
                }}
                allowClear={false}
                style={{ width: "100%" }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text strong style={{ fontSize: 12 }}>Jenis Layanan:</Text>
              <Select
                value={selectedLayanan}
                onChange={setSelectedLayanan}
                style={{ width: "100%" }}
              >
                <Option value="all">Semua Layanan</Option>
                <Option value="2">Rawat Jalan</Option>
                <Option value="1">Rawat Inap</Option>
                <Option value="3">IGD</Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text strong style={{ fontSize: 12 }}>Status Resep:</Text>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: "100%" }}
              >
                <Option value="all">Semua Status</Option>
                <Option value="2">Aktif</Option>
                <Option value="3">Selesai</Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text strong style={{ fontSize: 12 }}>Resep BPJS:</Text>
              <Select
                value={selectedStatusInput}
                onChange={setSelectedStatusInput}
                style={{ width: "100%" }}
              >
                <Option value="all">Semua Input</Option>
                <Option value="0">Belum Input</Option>
                <Option value="1">Selesai Input</Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text strong style={{ fontSize: 12 }}>Pencarian:</Text>
              <Input.Search
                placeholder="Cari nama pasien, No. RM, atau No. Resep..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
                enterButton
              />
            </div>
          </Col>
        </Row>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="id_pasien_resep"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          style={{ overflowX: "auto" }}
        />
      </Card>
    </div>
  );
}
