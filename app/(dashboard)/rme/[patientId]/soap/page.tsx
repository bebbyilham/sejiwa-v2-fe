"use client";

import React, { useState, useEffect } from "react";
import {
  Card, Form, Input, Select, Button, Space, Table, Drawer, Row, Col,
  Typography, App, Divider, Tag, Popconfirm
} from "antd";
import {
  SaveOutlined, MedicineBoxOutlined, SearchOutlined, PlusOutlined,
  DeleteOutlined, ExperimentOutlined, EyeOutlined
} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "../../../../lib/api";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface MedicationItem {
  key: string;
  name: string;
  dose: string;
  frequency: string;
  qty: number;
}

export default function SoapPage() {
  const { message } = App.useApp();
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // Drawer state for Penunjang (Lab/Rad results)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // SOAP State
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [selectedTindakan, setSelectedTindakan] = useState<string[]>([]);

  // Real API catalogs
  const [diagnosaOptions, setDiagnosaOptions] = useState<any[]>([]);
  const [searchingDiagnosa, setSearchingDiagnosa] = useState(false);

  const [obatOptions, setObatOptions] = useState<any[]>([]);
  const [searchingObat, setSearchingObat] = useState(false);

  const [tindakanOptions, setTindakanOptions] = useState<any[]>([]);

  const handleSearchDiagnosa = async (value: string) => {
    if (value.length < 2) return;
    setSearchingDiagnosa(true);
    try {
      const res = await apiRequest(`diagnosa?search=${value}`);
      if (res.status && res.data) {
        setDiagnosaOptions(res.data);
      }
    } catch (e) {
      console.error("Gagal mencari diagnosa:", e);
    } finally {
      setSearchingDiagnosa(false);
    }
  };

  const handleSearchObat = async (value: string) => {
    if (value.length < 2) return;
    setSearchingObat(true);
    try {
      const res = await apiRequest(`obat?search=${value}`);
      if (res.status && res.data) {
        setObatOptions(res.data);
      }
    } catch (e) {
      console.error("Gagal mencari obat:", e);
    } finally {
      setSearchingObat(false);
    }
  };

  useEffect(() => {
    const fetchTindakan = async () => {
      try {
        const res = await apiRequest("tindakan");
        if (res.status && res.data) {
          setTindakanOptions(res.data.map((t: any) => t.nama_tindakan));
        }
      } catch (e) {
        console.error("Gagal memuat tindakan:", e);
      }
    };
    
    const fetchDefaultObat = async () => {
      try {
        const res = await apiRequest("obat?search=a");
        if (res.status && res.data) {
          setObatOptions(res.data);
        }
      } catch (e) {
        console.error("Gagal memuat obat awal:", e);
      }
    };

    fetchTindakan();
    fetchDefaultObat();
  }, []);

  const tindakanCatalog = tindakanOptions.length > 0 ? tindakanOptions : [
    "Pemberian Terapi Injeksi", "EGC Monitoring", "Nebulizer Therapy",
    "Pemasangan Kateter Urin", "Perawatan Luka Dekubitus", "Infus Cairan IV"
  ];

  // Load existing SOAP draft if any
  useEffect(() => {
    const saved = localStorage.getItem(`soap_${patientId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      form.setFieldsValue({
        subjektif: parsed.subjektif,
        objektif: parsed.objektif,
        plan_notes: parsed.plan_notes
      });
      if (parsed.medications) setMedications(parsed.medications);
      if (parsed.diagnoses) setDiagnoses(parsed.diagnoses);
      if (parsed.selectedTindakan) setSelectedTindakan(parsed.selectedTindakan);
      message.info("Memuat draft SOAP yang belum tersimpan.");
    } else {
      // Prefill objektif with Vital Signs from Nurse Assessment if available
      const savedAsesmen = localStorage.getItem(`asesmen_${patientId}`);
      if (savedAsesmen) {
        const asesmen = JSON.parse(savedAsesmen);
        const physicalExam = `Keadaan Umum: ${asesmen.keadaan_umum || "Compos Mentis"}
Tekanan Darah: ${asesmen.tekanan_darah || "-"} mmHg
Nadi: ${asesmen.nadi || "-"} bpm
Suhu: ${asesmen.suhu || "-"} °C
Napas: ${asesmen.napas || "-"} /menit
Berat Badan: ${asesmen.berat_badan || "-"} kg
Tinggi Badan: ${asesmen.tinggi_badan || "-"} cm

Keluhan Utama: ${asesmen.keluhan_utama || "-"}`;
        form.setFieldsValue({
          subjektif: asesmen.keluhan_utama || "",
          objektif: physicalExam
        });
      }
    }
  }, [patientId, form]);

  const handleSaveSOAP = (values: any) => {
    setLoading(true);
    setTimeout(() => {
      const payload = {
        subjektif: values.subjektif,
        objektif: values.objektif,
        diagnoses,
        medications,
        selectedTindakan,
        plan_notes: values.plan_notes
      };

      // Save to localStorage mimicking backend persist
      localStorage.setItem(`soap_${patientId}`, JSON.stringify(payload));
      localStorage.setItem(`status_${patientId}`, "3"); // 3 = SOAP Dokter Selesai (Green Tag)
      
      message.success("Catatan SOAP Medis & E-Resep berhasil ditandatangani!");
      setLoading(false);
      
      // Redirect to history/riwayat page
      router.push(`/rme/${patientId}/riwayat`);
    }, 1200);
  };

  // Editable Table helper
  const handleEditMedication = (key: string, field: keyof MedicationItem, value: any) => {
    const updated = medications.map((med) => {
      if (med.key === key) {
        return { ...med, [field]: value };
      }
      return med;
    });
    setMedications(updated);
  };

  const handleAddMedication = () => {
    const newKey = (medications.length + 1).toString();
    const defaultObat = obatOptions.length > 0 ? obatOptions[0].nama_obat : "Amlodipine 5mg";
    const newMed: MedicationItem = {
      key: newKey,
      name: defaultObat,
      dose: "1 tablet",
      frequency: "3x sehari",
      qty: 10
    };
    setMedications([...medications, newMed]);
  };

  const handleDeleteMedication = (key: string) => {
    setMedications(medications.filter((med) => med.key !== key));
  };

  const toggleTindakan = (tindakan: string) => {
    if (selectedTindakan.includes(tindakan)) {
      setSelectedTindakan(selectedTindakan.filter((t) => t !== tindakan));
    } else {
      setSelectedTindakan([...selectedTindakan, tindakan]);
    }
  };

  const [penunjangData, setPenunjangData] = useState<{ laboratorium: any[]; radiologi: any[] } | null>(null);

  useEffect(() => {
    const fetchPenunjang = async () => {
      try {
        const res = await apiRequest(`penunjang/${patientId}`);
        if (res.status && res.data) {
          setPenunjangData(res.data);
        }
      } catch (e) {
        console.error("Gagal memuat data penunjang:", e);
      }
    };
    fetchPenunjang();
  }, [patientId]);

  // Editable table columns
  const medicationColumns = [
    {
      title: "Nama Obat",
      dataIndex: "name",
      key: "name",
      width: "35%",
      render: (text: string, record: MedicationItem) => (
        <Select
          showSearch
          value={text}
          onSearch={handleSearchObat}
          onChange={(val) => handleEditMedication(record.key, "name", val)}
          filterOption={false}
          notFoundContent={searchingObat ? "Mencari..." : null}
          style={{ width: "100%" }}
        >
          {obatOptions.map((drug) => (
            <Option key={drug.nama_obat} value={drug.nama_obat}>{drug.nama_obat}</Option>
          ))}
          {text && !obatOptions.some(o => o.nama_obat === text) && (
            <Option key={text} value={text}>{text}</Option>
          )}
        </Select>
      ),
    },
    {
      title: "Dosis",
      dataIndex: "dose",
      key: "dose",
      width: "20%",
      render: (text: string, record: MedicationItem) => (
        <Input
          value={text}
          onChange={(e) => handleEditMedication(record.key, "dose", e.target.value)}
        />
      ),
    },
    {
      title: "Aturan Pakai (Frekuensi)",
      dataIndex: "frequency",
      key: "frequency",
      width: "30%",
      render: (text: string, record: MedicationItem) => (
        <Input
          value={text}
          onChange={(e) => handleEditMedication(record.key, "frequency", e.target.value)}
        />
      ),
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      width: "10%",
      render: (text: number, record: MedicationItem) => (
        <Input
          type="number"
          value={text}
          onChange={(e) => handleEditMedication(record.key, "qty", parseInt(e.target.value) || 0)}
        />
      ),
    },
    {
      title: "",
      key: "action",
      width: "5%",
      render: (_: any, record: MedicationItem) => (
        <Popconfirm title="Hapus obat ini?" onConfirm={() => handleDeleteMedication(record.key)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ paddingBottom: 40 }}>
      <Form form={form} layout="vertical" onFinish={handleSaveSOAP}>
        <Row gutter={[16, 16]}>
          {/* LEFT SIDE: SOAP Input & Diagnosis */}
          <Col xs={24} lg={16}>
            <Card
              title={<strong>Pemeriksaan Dokter (S.O.A.P)</strong>}
              extra={
                <Button
                  type="dashed"
                  icon={<ExperimentOutlined />}
                  onClick={() => setIsDrawerOpen(true)}
                  style={{ color: "#fa8c16", borderColor: "#fa8c16" }}
                >
                  Lihat Hasil Lab & Rad
                </Button>
              }
              variant="borderless"
              style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
            >
              {/* S & O catatans */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={<strong>Subjektif (Keluhan & Anamnesis)</strong>}
                    name="subjektif"
                    rules={[{ required: true }]}
                  >
                    <TextArea rows={5} placeholder="Masukkan deskripsi keluhan dan riwayat medis yang dideskripsikan pasien..." autoSize={{ minRows: 5, maxRows: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={<strong>Objektif (Pemeriksaan Fisik & Penunjang)</strong>}
                    name="objektif"
                    rules={[{ required: true }]}
                  >
                    <TextArea rows={5} placeholder="Masukkan hasil pemeriksaan vital sign, fisik, status lokalis, dan laboratorium penunjang..." autoSize={{ minRows: 5, maxRows: 8 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: "16px 0" }} />

              {/* Diagnosis Autocomplete */}
              <Form.Item label={<strong>Asesmen (Diagnosis / ICD-10)</strong>} required>
                <Select
                  mode="multiple"
                  showSearch
                  placeholder="Ketik kode atau nama diagnosa (ICD-10) untuk mencari..."
                  value={diagnoses}
                  onChange={(vals) => setDiagnoses(vals)}
                  onSearch={handleSearchDiagnosa}
                  filterOption={false}
                  notFoundContent={searchingDiagnosa ? "Mencari..." : "Ketik untuk mencari diagnosa"}
                  style={{ width: "100%" }}
                  size="large"
                >
                  {diagnosaOptions.map((item) => (
                    <Option key={item.kode} value={item.kode}>
                      {item.kode} - {item.nama}
                    </Option>
                  ))}
                  {diagnoses.filter(d => !diagnosaOptions.some(opt => opt.kode === d)).map(d => (
                    <Option key={d} value={d}>
                      {d}
                    </Option>
                  ))}
                </Select>
                <div style={{ marginTop: 8 }}>
                  {diagnoses.map((code) => (
                    <Tag color="volcano" key={code} closable onClose={() => setDiagnoses(diagnoses.filter((c) => c !== code))} style={{ fontSize: 13, padding: "2px 8px" }}>
                      {code}
                    </Tag>
                  ))}
                </div>
              </Form.Item>

              <Divider style={{ margin: "16px 0" }} />

              {/* E-Prescription (Keranjang Obat) */}
              <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>
                  <MedicineBoxOutlined style={{ marginRight: 6, color: "#1890ff" }} />
                  Plan: E-Resep (Keranjang Obat)
                </span>
                <Button type="dashed" onClick={handleAddMedication} icon={<PlusOutlined />} size="small">
                  Tambah Resep Obat
                </Button>
              </div>

              <Table
                dataSource={medications}
                columns={medicationColumns}
                pagination={false}
                bordered
                size="small"
                style={{ marginBottom: 20 }}
              />

              {/* Plan Notes */}
              <Form.Item label={<strong>Rencana Tindak Lanjut & Instruksi Medis</strong>} name="plan_notes">
                <TextArea rows={3} placeholder="Contoh: Rencana kontrol ulang 1 minggu lagi, edukasi kurangi konsumsi garam..." />
              </Form.Item>
            </Card>
          </Col>

          {/* RIGHT SIDE: Tindakan Medis catalog */}
          <Col xs={24} lg={8}>
            <Card title={<strong>Pilih Tindakan Medis</strong>} variant="borderless" style={{ borderRadius: 8, height: "100%", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Pilih tindakan medis cepat yang dilakukan hari ini:
              </Text>
              <Divider style={{ margin: "12px 0" }} />
              
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tindakanCatalog.map((tind) => (
                  <div
                    key={tind}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderRadius: 6,
                      backgroundColor: selectedTindakan.includes(tind) ? "rgba(9, 109, 217, 0.15)" : "var(--input-bg)",
                      border: selectedTindakan.includes(tind) ? "1px solid var(--primary-color)" : "1px solid var(--glass-border)",
                      transition: "all 0.2s",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                    onClick={() => toggleTindakan(tind)}
                  >
                    <Text strong={selectedTindakan.includes(tind)} style={{ fontSize: 13, color: "var(--text-primary)" }}>
                      {tind}
                    </Text>
                    {selectedTindakan.includes(tind) && <Tag color="blue">Terpilih</Tag>}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24 }}>
                <Text strong style={{ fontSize: 13 }}>Tindakan Terpilih ({selectedTindakan.length}):</Text>
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selectedTindakan.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 11 }}>Belum ada tindakan dipilih</Text>
                  ) : (
                    selectedTindakan.map((t) => (
                      <Tag color="blue" key={t} closable onClose={() => toggleTindakan(t)}>
                        {t}
                      </Tag>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Footer Actions */}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <Space size="large">
            <Button size="large" onClick={() => router.push("/antrean")}>Batal</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
              style={{ width: 250, background: "linear-gradient(90deg, #1890ff 0%, #096dd9 100%)", border: "none" }}
            >
              Sign & Simpan Rekam Medis
            </Button>
          </Space>
        </div>
      </Form>

      {/* Drawer Hasil Penunjang Medis */}
      <Drawer
        title={<strong>Hasil Laboratorium & Radiologi</strong>}
        placement="right"
        size={480}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
      >
        <Paragraph>Berikut hasil laboratorium dan radiologi terbaru milik pasien.</Paragraph>
        <Divider />
        
        {penunjangData?.laboratorium && penunjangData.laboratorium.length > 0 ? (
          penunjangData.laboratorium.map((lab, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <Title level={5} style={{ color: "#1890ff", margin: 0 }}>
                <ExperimentOutlined /> Laboratorium (Tanggal: {lab.tanggal})
              </Title>
              <Text type="secondary" style={{ fontSize: 11 }}>Dokter Pengirim: {lab.dokter || "-"}</Text>
              <div style={{ padding: 12, backgroundColor: "#f9f9f9", borderRadius: 8, marginTop: 8 }}>
                {lab.pemeriksaan.map((item: any, idx: number) => (
                  <Row key={idx} style={{ marginBottom: 8 }}>
                    <Col span={12}><Text type="secondary">{item.nama_parameter}:</Text></Col>
                    <Col span={12}>
                      <Text strong>{item.hasil || "-"}</Text>{" "}
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        (Normal: {item.nilai_normal || "-"})
                      </Text>
                    </Col>
                  </Row>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <Text type="secondary">Tidak ada data hasil pemeriksaan Laboratorium.</Text>
          </div>
        )}

        <Divider />

        {penunjangData?.radiologi && penunjangData.radiologi.length > 0 ? (
          penunjangData.radiologi.map((rad, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <Title level={5} style={{ color: "#1890ff", margin: 0 }}>
                <EyeOutlined /> Radiologi (Tanggal: {rad.tanggal})
              </Title>
              <Text type="secondary" style={{ fontSize: 11 }}>Dokter Pengirim: {rad.dokter || "-"}</Text>
              <div style={{ padding: 12, backgroundColor: "#f9f9f9", borderRadius: 8, marginTop: 8 }}>
                <Text strong style={{ fontSize: 12 }}>Hasil Interpretasi:</Text>
                <Paragraph italic style={{ fontSize: 13, marginTop: 4, whiteSpace: "pre-wrap" }}>
                  "{rad.isi_interpretasi || "Belum ada hasil interpretasi"}"
                </Paragraph>
                {rad.gejala_klinis && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Gejala Klinis: {rad.gejala_klinis}</Text>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <Text type="secondary">Tidak ada data hasil pemeriksaan Radiologi.</Text>
          </div>
        )}

        <div style={{ marginTop: 40, textAlign: "right" }}>
          <Button type="primary" onClick={() => setIsDrawerOpen(false)}>Tutup Panel</Button>
        </div>
      </Drawer>
    </div>
  );
}
