import React, { useState } from "react";
import ReactCountryFlag from "react-country-flag";
import countryCodeLookup from "country-code-lookup";
import axios from "axios";

interface AnalysisResultsProps {
  data: Array<{
    clave: string;
    [key: string]: any;
  }>;
  onBack: () => void;
  tableInfo: {
    esquema: string;
    tabla: string;
  };
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ data, onBack, tableInfo }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/analyze-table', {
        params: {
          esquema: tableInfo.esquema,
          tabla: tableInfo.tabla
        },
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Data recibida:', response.data);
      setAnalysisResult(response.data);
    } catch (err: any) {
      console.error('Error al analizar la tabla:', err);
      setError(`Error al analizar la tabla: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getCountries = () => {
    const countryCodes = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== "clave" && typeof item[key] === "object") {
          Object.keys(item[key]).forEach(code => countryCodes.add(code));
        }
      });
    });
    return Array.from(countryCodes).sort();
  };

  const countries = getCountries();
  const isoProperties = data.length > 0 
    ? Object.keys(data[0]).filter(key => key !== "clave") 
    : [];

  const filteredData = analysisResult.length > 0 ? analysisResult : data.filter(item => {
    return (
      item.clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
      isoProperties.some(prop => 
        typeof item[prop] === "object" &&
        Object.values(item[prop]).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getCountryCode = (paisCode: string) => {
    const country =
      countryCodeLookup.byIso(paisCode) || countryCodeLookup.byFips(paisCode);
    return country?.iso2 || "CL";
  };

  return (
    <div className="p-8 overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Resultados del Análisis</h1>
          <p className="text-sm text-gray-500">
            Esquema: {tableInfo.esquema} | Tabla: {tableInfo.tabla}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleAnalyze} 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner"></span>
                Analizando...
              </>
            ) : (
              "Analizar"
            )}
          </button>
          <button onClick={onBack} className="btn btn-secondary">
            Volver
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Buscar..."
          className="input input-bordered w-full max-w-xs"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <div className="badge badge-info">
          {filteredData.length} registros encontrados
        </div>
      </div>

 <div className="overflow-auto border rounded-lg shadow-md">
  <table className="min-w-[1000px] table table-sm">
    <thead className="bg-gray-200 text-xs sticky top-0 z-10">
      <tr>
        <th className="bg-gray-200 border px-2 py-1">Clave</th>
        {isoProperties.map((prop) => (
          <th key={prop} colSpan={countries.length} className="bg-gray-200 border px-2 py-1">
            <div className="text-center font-semibold">{prop}</div>
            <div className="flex justify-center flex-wrap gap-1 mt-1">
              {countries.map((country) => (
                <div key={`${prop}-${country}`} className="px-1">
                  <ReactCountryFlag
                    countryCode={getCountryCode(country)}
                    svg
                    style={{ width: "1em", height: "1em" }}
                    title={country}
                  />
                </div>
              ))}
            </div>
          </th>
        ))}
      </tr>
    </thead>
    <tbody className="text-xs">
      {paginatedData.map((item, index) => (
        <tr
          key={index}
          className={index % 2 === 0 ? "bg-white border" : "bg-gray-50 border hover:bg-gray-100"}
        >
          <td className="px-2 py-1 border">{item.clave}</td>
          {isoProperties.map((prop) => (
            <React.Fragment key={prop}>
              {countries.map((country) => {
                const value = item[prop]?.[country];
                return (
                  <td
                    key={`${prop}-${country}`}
                    className={`text-center px-2 py-1 border ${
                      value === null || value === undefined || value === ""
                        ? "bg-red-100 text-red-600 font-semibold"
                        : ""
                    }`}
                  >
                    {value || "-"}
                  </td>
                );
              })}
            </React.Fragment>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</div>

      <div className="flex justify-center mt-4">
        <div className="join">
          <button
            className="join-item btn"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            «
          </button>
          <button className="join-item btn">
            Página {currentPage} de {totalPages}
          </button>
          <button
            className="join-item btn"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages || totalPages === 0}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
