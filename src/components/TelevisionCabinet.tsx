/** A wide version of the original white pencil TV, with room for the broadcast. */
export default function TelevisionCabinet() {
  return (
    <svg className="cabinet-drawing" viewBox="0 0 1440 1000" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false">
      <g className="cabinet-fill">
        <path d="M170 886 L220 888 186 980 147 982Z M1210 888 L1262 886 1297 982 1258 981Z" />
        <path d="M650 115 Q690 75 745 116 L746 137 648 137Z" />
        <path d="M44 132 L1391 136 Q1416 137 1417 165 L1413 869 Q1413 895 1386 898 L48 893 Q22 892 23 865 L26 163 Q25 135 44 132Z" />
      </g>
      <g className="cabinet-outline">
        <path d="M44 132 L1391 136 Q1416 137 1417 165 L1413 869 Q1413 895 1386 898 L48 893 Q22 892 23 865 L26 163 Q25 135 44 132Z" />
        <path d="M49 142 L1387 146 Q1406 146 1407 168 L1403 866 Q1403 886 1382 887 L51 883 Q34 883 34 862 L37 165 Q36 145 49 142Z" />
        <path d="M48 895 L61 909 1373 913 1388 900 M65 902 L1376 905" />
        <path d="M170 908 L215 909 184 979 150 981Z M179 916 L160 974 M201 915 L179 974" />
        <path d="M1213 913 L1258 910 1293 980 1260 979Z M1224 918 L1268 975 M1246 916 L1284 976" />
        <path d="M650 115 Q690 75 745 116 L746 137 648 137Z M660 119 L735 120 M681 101 L518 9 M687 99 L522 7 M709 101 L858 4 M715 103 L862 6" />
        <circle cx="518" cy="8" r="3" /><circle cx="862" cy="5" r="3" />
      </g>
      <g className="cabinet-screen-outline">
        <path d="M114 166 Q64 169 62 220 L59 805 Q63 860 115 865 L1166 867 Q1214 864 1219 812 L1222 222 Q1219 170 1169 169Z" />
        <path d="M119 177 Q77 178 75 225 L72 800 Q76 849 120 853 L1160 856 Q1203 852 1207 805 L1210 228 Q1207 183 1164 181Z" />
      </g>
      <g className="cabinet-outline">
        <path d="M1253 170 L1374 171 Q1387 172 1387 186 L1383 847 Q1383 864 1367 865 L1251 864 Q1239 864 1239 848 L1241 188 Q1241 171 1253 170Z" />
        <path d="M1253 187 L1374 188 1373 239 1253 238Z M1262 201 L1365 202 M1262 211 L1365 212 M1262 221 L1365 222" />
        {[271, 299, 327].map((y) => <g key={y}><rect x="1255" y={y} width="21" height="11" rx="4" /><rect x="1287" y={y} width="21" height="11" rx="4" /><rect x="1319" y={y} width="21" height="11" rx="4" /><rect x="1351" y={y} width="21" height="11" rx="4" /></g>)}
        <path d="M1254 359 L1371 360 1371 383 1254 382Z M1254 401 L1371 402 1371 425 1254 424Z" />
        {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M1254 ${465 + i * 10} L1371 ${466 + i * 10}`} />)}
        <circle cx="1312" cy="734" r="43" /><circle cx="1312" cy="734" r="35" />
        <path d="M1291 760 L1327 704 1334 709 1298 765Z M1299 756 L1327 713" />
        <circle cx="1273" cy="818" r="15" /><circle cx="1350" cy="818" r="15" />
        <path d="M1267 807 L1280 828 M1344 807 L1357 828" />
      </g>
      <g className="cabinet-hatching">
        {Array.from({ length: 27 }, (_, i) => <path key={i} d={`M${70 + i * 48} 151 l14 7 M${70 + i * 48} 873 l14 7`} />)}
        {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M42 ${194 + i * 37} l10 13 M1391 ${194 + i * 37} l8 13`} />)}
        <path d="M140 988 Q720 1000 1310 989 M210 991 L310 995 M1140 994 L1240 991" />
      </g>
    </svg>
  );
}
