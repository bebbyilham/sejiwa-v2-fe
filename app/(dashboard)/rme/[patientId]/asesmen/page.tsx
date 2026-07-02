"use client";

import React, { useState, useEffect } from "react";
import { Card, Form, Input, InputNumber, Radio, Select, Button, Slider, Row, Col, Space, Typography, App, Divider } from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function AsesmenPage() {
  const { message } = App.useApp();
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // State for BMI auto-calculation
  const weight = Form.useWatch("berat_badan", form);
  const height = Form.useWatch("tinggi_badan", form);
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState<string>("");

  useEffect(() => {
    if (weight && height) {
      const heightInMeters = height / 100;
      const calculatedBmi = weight / (heightInMeters * heightInMeters);
      const roundedBmi = parseFloat(calculatedBmi.toFixed(1));
      setBmi(roundedBmi);

      if (roundedBmi < 18.5) setBmiCategory("Kurus (Underweight)");
      else if (roundedBmi >= 18.5 && roundedBmi < 25) setBmiCategory("Normal (Ideal)");
      else if (roundedBmi >= 25 && roundedBmi < 30) setBmiCategory("Kelebihan Berat Badan (Overweight)");
      else setBmiCategory("Obesitas");
    } else {
      setBmi(null);
      setBmiCategory("");
    }
  }, [weight, height]);

  // Load existing local storage if any
  useEffect(() => {
    const saved = localStorage.getItem(`asesmen_${patientId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      form.setFieldsValue(parsed);
      message.info("Memuat draft asesmen yang tersimpan secara lokal.");
    }
  }, [patientId, form]);

  const handleSave = (values: any) => {
    setLoading(true);
    // Simulate API Saving
    setTimeout(() => {
      localStorage.setItem(`asesmen_${patientId}`, JSON.stringify(values));
      // Save status as assessed
      localStorage.setItem(`status_${patientId}`, "2"); // 2 = Asesmen Selesai (Orange Tag)
      message.success("Asesmen Keperawatan berhasil disimpan ke rekam medis!");
      setLoading(false);
      // Redirect to SOAP for Doctor
      router.push(`/rme/${patientId}/soap`);
    }, 1000);
  };

  const handleReset = () => {
    form.resetFields();
    localStorage.removeItem(`asesmen_${patientId}`);
    message.warning("Form asesmen direset.");
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          keadaan_umum: "Compos Mentis",
          nyeri: 0,
          skrining_gizi: "tidak_berisiko",
          alat_bantu: "tidak_ada",
        }}
      >
        <Row gutter={[16, 16]}>
          {/* Keluhan & Keadaan Umum */}
          <Col xs={24} lg={12}>
            <Card title={<strong>Keluhan Utama & Keadaan Umum</strong>} variant="borderless" style={{ borderRadius: 8, height: "100%" }}>
              <Form.Item
                label={<strong>Keluhan Utama Pasien</strong>}
                name="keluhan_utama"
                rules={[{ required: true, message: "Silakan masukkan keluhan utama pasien!" }]}
              >
                <TextArea rows={4} placeholder="Masukkan keluhan utama, riwayat penyakit saat ini, dan kondisi awal pasien..." autoSize={{ minRows: 4, maxRows: 6 }} />
              </Form.Item>

              <Form.Item label={<strong>Keadaan Umum (Kesadaran)</strong>} name="keadaan_umum">
                <Select size="large">
                  <Option value="Compos Mentis">Compos Mentis (Sadar Penuh)</Option>
                  <Option value="Apatis">Apatis (Pikiran Melayang)</Option>
                  <Option value="Somnolen">Somnolen (Mengantuk Berat)</Option>
                  <Option value="Sopor">Sopor (Hampir Tidak Sadar)</Option>
                  <Option value="Coma">Coma (Tidak Sadar)</Option>
                </Select>
              </Form.Item>

              <Form.Item label={<strong>Alat Bantu Jalan</strong>} name="alat_bantu">
                <Radio.Group>
                  <Radio value="tidak_ada">Tidak Ada</Radio>
                  <Radio value="tongkat">Tongkat</Radio>
                  <Radio value="kursi_roda">Kursi Roda</Radio>
                  <Radio value="kruk">Kruk / Walker</Radio>
                </Radio.Group>
              </Form.Item>
            </Card>
          </Col>

          {/* Tanda Vital (Vital Signs) */}
          <Col xs={24} lg={12}>
            <Card title={<strong>Tanda Vital & Antropometri</strong>} variant="borderless" style={{ borderRadius: 8, height: "100%" }}>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Tekanan Darah"
                    name="tekanan_darah"
                    rules={[{ required: true, message: "Contoh: 120/80" }]}
                  >
                    <Input placeholder="120/80" suffix="mmHg" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Denyut Nadi"
                    name="nadi"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} max={250} style={{ width: "100%" }} suffix="bpm" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Suhu Tubuh"
                    name="suhu"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={30} max={45} step={0.1} style={{ width: "100%" }} suffix="°C" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Frekuensi Napas"
                    name="napas"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} max={100} style={{ width: "100%" }} suffix="/menit" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: "12px 0" }} />

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Berat Badan (BB)" name="berat_badan">
                    <InputNumber min={0} max={300} style={{ width: "100%" }} suffix="kg" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Tinggi Badan (TB)" name="tinggi_badan">
                    <InputNumber min={0} max={250} style={{ width: "100%" }} suffix="cm" />
                  </Form.Item>
                </Col>
              </Row>

              {bmi && (
                <div style={{ marginTop: 8, padding: "8px 12px", backgroundColor: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 6 }}>
                  <Text>Indeks Massa Tubuh (IMT): <strong>{bmi}</strong></Text>
                  <br />
                  <Text type="secondary">Kategori: <strong>{bmiCategory}</strong></Text>
                </div>
              )}
            </Card>
          </Col>

          {/* Skrining Tambahan */}
          <Col xs={24}>
            <Card title={<strong>Asesmen Nyeri & Skrining Gizi</strong>} variant="borderless" style={{ borderRadius: 8 }}>
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item label={<strong>Tingkat Nyeri (Visual Analogue Scale 0-10)</strong>} name="nyeri">
                    <div>
                      <Slider
                        min={0}
                        max={10}
                        marks={{
                          0: "Tidak Nyeri",
                          4: "Nyeri Sedang",
                          7: "Nyeri Hebat",
                          10: "Sangat Hebat",
                        }}
                      />
                    </div>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label={<strong>Skrining Gizi Awal</strong>} name="skrining_gizi">
                    <Radio.Group>
                      <Space orientation="vertical">
                        <Radio value="tidak_berisiko">Tidak Berisiko (Penurunan BB & nafsu makan normal)</Radio>
                        <Radio value="berisiko_ringan">Risiko Ringan (Ada penurunan BB sedikit / asupan berkurang)</Radio>
                        <Radio value="berisiko_tinggi">Risiko Tinggi (Penurunan BB signifikan / tidak nafsu makan berat)</Radio>
                      </Space>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Footer Actions */}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <Space size="middle">
            <Button icon={<ReloadOutlined />} onClick={handleReset} size="large">
              Reset Form
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
              style={{ background: "#52c41a", borderColor: "#52c41a", width: 220 }}
            >
              Simpan & Lanjutkan
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}
