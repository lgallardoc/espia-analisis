import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactCountryFlag from "react-country-flag";
import countryCodeLookup from "country-code-lookup";
import "../styles/custom.css";
import AnalysisResults from "../components/AnalysisResults";

interface FileData {
  pais: string;
  esquema: string;
  tabla: string;
  fecha: string;
}

interface ProcessedData {
  esquema: string;
  tabla: string;
  paises: Record<string, string>;
}

interface AnalysisResult {
  clave: string;
  [key: string]: any;
}

export default function Analysis() {
  const [data, setData] = useState<ProcessedData[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [currentTable, setCurrentTable] = useState<{esquema: string, tabla: string} | null>(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/files")
      .then((res) => {
        const processed: Record<string, ProcessedData> = {};
        const countrySet = new Set<string>();

        res.data.forEach((file: FileData) => {
          const key = `${file.esquema}_${file.tabla}`;
          countrySet.add(file.pais);

          if (!processed[key]) {
            processed[key] = {
              esquema: file.esquema,
              tabla: file.tabla,
              paises: {},
            };
          }
          processed[key].paises[file.pais] = file.fecha.split("T")[0];
        });

        setCountries(Array.from(countrySet).sort());
        setData(Object.values(processed));
      })
      .catch((err) => console.error(err));
  }, []);

  const handleAnalyze = (esquema: string, tabla: string) => {
    const key = `${esquema}_${tabla}`;
    setIsLoading(prev => ({...prev, [key]: true}));
    setCurrentTable({esquema, tabla});
    
    axios.get(`http://localhost:5000/api/analyze-table?esquema=${esquema}&tabla=${tabla}`)
      .then((res) => {
        setAnalysisData(res.data);
        setShowResults(true);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(prev => ({...prev, [key]: false})));
  };

  const getCountryCode = (paisCode: string) => {
    const country = countryCodeLookup.byIso(paisCode) || countryCodeLookup.byFips(paisCode);
    return country?.iso2 || "CL";
  };

  if (showResults && currentTable) {
    return (
      <AnalysisResults 
        data={analysisData} 
        onBack={() => setShowResults(false)}
        tableInfo={currentTable}
      />
    );
  }

  return (
    <div className="p-8 overflow-x-auto">
      <h1 className="text-2xl font-bold mb-6">Matriz de Archivos por País</h1>

      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Esquema</th>
            <th>Tabla</th>
            {countries.map((country) => (
              <th key={country} className="text-center">
                <div className="flex flex-col items-center">
                  <ReactCountryFlag
                    countryCode={getCountryCode(country)}
                    svg
                    style={{ width: "1.5em", height: "1.5em" }}
                  />
                  <span>{country}</span>
                </div>
              </th>
            ))}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const key = `${item.esquema}_${item.tabla}`;
            return (
              <tr key={index}>
                <td>{item.esquema}</td>
                <td>{item.tabla}</td>
                {countries.map((country) => (
                  <td key={country} className="text-center">
                    {item.paises[country] ? (
                      <span className="badge badge-success">
                        {item.paises[country]}
                      </span>
                    ) : (
                      <span className="badge badge-error">×</span>
                    )}
                  </td>
                ))}
                <td>
                  <button
                    onClick={() => handleAnalyze(item.esquema, item.tabla)}
                    className="btn btn-primary btn-sm"
                    disabled={isLoading[key]}
                  >
                    {isLoading[key] ? (
                      <>
                        <span className="loading loading-spinner"></span>
                        Analizando...
                      </>
                    ) : (
                      "Analizar"
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}