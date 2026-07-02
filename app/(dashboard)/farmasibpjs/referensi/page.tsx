"use client";

import React, { useState, useEffect } from "react";
import {
  Card, Table, Tag, DatePicker, Select, Button, Space, Typography,
  Input, Tabs, App, Row, Col
} from "antd";
import {
  BookOutlined, SearchOutlined, MedicineBoxOutlined,
  CompassOutlined, UserOutlined, ApartmentOutlined
} from "@ant-design/icons";
import { apiRequest } from "../../../lib/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

export default function ReferensiPage() {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState("obat");

  // Tab 1: Obat Search state
  const [obatSearch, setObatSearch] = useState("");
  const [obatJenis, setObatJenis] = useState("2"); // 1=DPHO, 2=Generik, 3=Bermerk
  const [obatTanggal, setObatTanggal] = useState(dayjs().format("YYYY-MM-DD"));
  const [obatData, setObatData] = useState<any[]>([]);
  const [loadingObat, setLoadingObat] = useState(false);

  // Tab 2: DPHO State
  const [dphoData, setDphoData] = useState<any[]>([]);
  const [loadingDpho, setLoadingDpho] = useState(false);

  // Tab 3: Poli State
  const [poliData, setPoliData] = useState<any[]>([]);
  const [loadingPoli, setLoadingPoli] = useState(false);

  // Tab 4: Spesialis State
  const [spesialisData, setSpesialisData] = useState<any[]>([]);
  const [loadingSpesialis, setLoadingSpesialis] = useState(false);

  // Tab 5: Faskes Search state
  const [faskesSearch, setFaskesSearch] = useState("");
  const [faskesJenis, setFaskesJenis] = useState("1"); // 1=Faskes 1, 2=Faskes 2/RS
  const [faskesData, setFaskesData] = useState<any[]>([]);
  const [loadingFaskes, setLoadingFaskes] = useState(false);

  // Search Obat
  const handleSearchObat = async () => {
    if (!obatSearch || obatSearch.length < 3) {
      message.warning("Masukkan minimal 3 karakter untuk nama obat");
      return;
    }
    setLoadingObat(true);
    try {
      const res = await apiRequest(`farmasibpjs/referensi/obat?jenis=${obatJenis}&nama=${encodeURIComponent(obatSearch)}&tanggal=${obatTanggal}`);
      if (res.status && res.data && res.data.list) {
        setObatData(res.data.list);
      } else {
        setObatData([]);
        message.info(res.message || "Data obat tidak ditemukan");
      }
    } catch (e: any) {
      message.error("Gagal mencari obat: " + e.message);
    } finally {
      setLoadingObat(false);
    }
  };

  // Fetch DPHO
  const fetchDpho = async () => {
    setLoadingDpho(true);
    try {
      const res = await apiRequest("farmasibpjs/referensi/dpho");
      if (res.status && res.data && res.data.list) {
        setDphoData(res.data.list);
      } else {
        setDphoData([]);
      }
    } catch (e: any) {
      message.error("Gagal memuat DPHO: " + e.message);
    } finally {
      setLoadingDpho(false);
    }
  };

  // Fetch Poli
  const fetchPoli = async () => {
    setLoadingPoli(true);
    try {
      const res = await apiRequest("farmasibpjs/referensi/poli");
      if (res.status && res.data && res.data.list) {
        setPoliData(res.data.list);
      } else {
        setPoliData([]);
      }
    } catch (e: any) {
      message.error("Gagal memuat poliklinik: " + e.message);
    } finally {
      setLoadingPoli(false);
    }
  };

  // Fetch Spesialis
  const fetchSpesialis = async () => {
    setLoadingSpesialis(true);
    try {
      const res = await apiRequest("farmasibpjs/referensi/spesialis");
      if (res.status && res.data && res.data.list) {
        setSpesialisData(res.data.list);
      } else {
        setSpesialisData([]);
      }
    } catch (e: any) {
      message.error("Gagal memuat spesialis: " + e.message);
    } finally {
      setLoadingSpesialis(false);
    }
  };

  // Search Faskes
  const handleSearchFaskes = async () => {
    if (!faskesSearch || faskesSearch.length < 3) {
      message.warning("Masukkan minimal 3 karakter untuk nama faskes");
      return;
    }
    setLoadingFaskes(true);
    try {
      const res = await apiRequest(`farmasibpjs/referensi/faskes?jenis=${faskesJenis}&nama=${encodeURIComponent(faskesSearch)}`);
      if (res.status && res.data && res.data.list) {
        setFaskesData(res.data.list);
      } else {
        setFaskesData([]);
        message.info(res.message || "Data faskes tidak ditemukan");
      }
    } catch (e: any) {
      message.error("Gagal mencari faskes: " + e.message);
    } finally {
      setLoadingFaskes(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dpho" && dphoData.length === 0) fetchDpho();
    if (activeTab === "poli" && poliData.length === 0) fetchPoli();
    if (activeTab === "spesialis" && spesialisData.length === 0) fetchSpesialis();
  }, [activeTab]);

  const tabItems = [
    {
      key: "obat",
      label: (
        <span>
          <MedicineBoxOutlined /> Cari Obat
        </span>
      ),
      children: (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 20, alignItems: "flex-end" }}>
            <Col xs={24} sm={12} md={6}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Text strong style={{ fontSize: 12 }}>Nama Obat:</Text>
                <Input
                  placeholder="Masukkan nama obat (min 3 huruf)..."
                  value={obatSearch}
                  onChange={(e) => setObatSearch(e.target.value)}
                  onPressEnter={handleSearchObat}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Text strong style={{ fontSize: 12 }}>Jenis Obat:</Text>
                <Select value={obatJenis} onChange={setObatJenis} style={{ width: "100%" }}>
                  <Option value="1">DPHO</Option>
                  <Option value="2">Generik</Option>
                  <Option value="3">Bermerk</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Text strong style={{ fontSize: 12 }}>Tanggal:</Text>
                <DatePicker
                  value={dayjs(obatTanggal)}
                  onChange={(date) => {
                    if (date) setObatTanggal(date.format("YYYY-MM-DD"));
                  }}
                  allowClear={false}
                  style={{ width: "100%" }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearchObat}
                loading={loadingObat}
                style={{ width: "100%" }}
              >
                Cari Obat
              </Button>
            </Col>
          </Row>

          <Table
            dataSource={obatData}
            columns={[
              { title: "Kode Obat", dataIndex: "kode", key: "kode" },
              { title: "Nama Obat", dataIndex: "nama", key: "nama" },
              { title: "Restriksi", dataIndex: "restriksi", key: "restriksi", render: (val) => val || "-" },
              { title: "Sub Kelompok Terapi", dataIndex: "namaSubKelompok", key: "namaSubKelompok", render: (val) => val || "-" },
            ]}
            rowKey="kode"
            loading={loadingObat}
            pagination={{ pageSize: 10 }}
          />
        </>
      ),
    },
    {
      key: "dpho",
      label: (
        <span>
          <BookOutlined /> DPHO
        </span>
      ),
      children: (
        <Table
          dataSource={dphoData}
          columns={[
            { title: "Kode Sub Kelompok", dataIndex: "kodeSubKelompok", key: "kodeSubKelompok" },
            { title: "Sub Kelompok Terapi", dataIndex: "namaSubKelompok", key: "namaSubKelompok" },
            { title: "Kode Kelompok", dataIndex: "kodeKelompok", key: "kodeKelompok" },
            { title: "Kelompok Terapi", dataIndex: "namaKelompok", key: "namaKelompok" },
          ]}
          rowKey="kodeSubKelompok"
          loading={loadingDpho}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: "poli",
      label: (
        <span>
          <ApartmentOutlined /> Poliklinik
        </span>
      ),
      children: (
        <Table
          dataSource={poliData}
          columns={[
            { title: "Kode Poli", dataIndex: "kode", key: "kode" },
            { title: "Nama Poli", dataIndex: "nama", key: "nama" },
          ]}
          rowKey="kode"
          loading={loadingPoli}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: "spesialis",
      label: (
        <span>
          <UserOutlined /> Spesialis
        </span>
      ),
      children: (
        <Table
          dataSource={spesialisData}
          columns={[
            { title: "Kode Spesialis", dataIndex: "kode", key: "kode" },
            { title: "Nama Spesialis", dataIndex: "nama", key: "nama" },
          ]}
          rowKey="kode"
          loading={loadingSpesialis}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: "faskes",
      label: (
        <span>
          <CompassOutlined /> PPK / Faskes
        </span>
      ),
      children: (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 20, alignItems: "flex-end" }}>
            <Col xs={24} sm={12} md={10}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Text strong style={{ fontSize: 12 }}>Nama Faskes:</Text>
                <Input
                  placeholder="Masukkan nama faskes (min 3 huruf)..."
                  value={faskesSearch}
                  onChange={(e) => setFaskesSearch(e.target.value)}
                  onPressEnter={handleSearchFaskes}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Text strong style={{ fontSize: 12 }}>Jenis Faskes:</Text>
                <Select value={faskesJenis} onChange={setFaskesJenis} style={{ width: "100%" }}>
                  <Option value="1">Faskes Tingkat 1</Option>
                  <Option value="2">Faskes Rujukan / RS</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearchFaskes}
                loading={loadingFaskes}
                style={{ width: "100%" }}
              >
                Cari Faskes
              </Button>
            </Col>
          </Row>

          <Table
            dataSource={faskesData}
            columns={[
              { title: "Kode Faskes", dataIndex: "kode", key: "kode" },
              { title: "Nama Faskes", dataIndex: "nama", key: "nama" },
            ]}
            rowKey="kode"
            loading={loadingFaskes}
            pagination={{ pageSize: 10 }}
          />
        </>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            <BookOutlined style={{ marginRight: 8, color: "var(--primary-color)" }} />
            Referensi BPJS Kesehatan
          </Title>
        }
        variant="borderless"
        style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  );
}
