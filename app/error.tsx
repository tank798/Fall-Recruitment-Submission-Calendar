"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-6">
      <div className="max-w-md text-center">
        <p className="text-base font-semibold text-slate-900">暂时没能读取数据</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          数据文件读取失败，可能是 data/data.json 暂时不可用。数据已自动备份，
          不会丢失，点击下方按钮重试。
        </p>
        <button
          className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          onClick={reset}
          type="button"
        >
          重新加载
        </button>
      </div>
    </main>
  );
}
