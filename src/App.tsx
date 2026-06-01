import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import TaskInput from './components/TaskInput';
import AIStatusDisplay from './components/AIStatusDisplay';
import EmailPanel from './components/panels/EmailPanel';
import ResearchPanel from './components/panels/ResearchPanel';
import CodingPanel from './components/panels/CodingPanel';
import DocumentPanel from './components/panels/DocumentPanel';
import SchedulePanel from './components/panels/SchedulePanel';
import ProjectResultsPanel from './components/panels/ProjectResultsPanel';
import { useStore } from './store';
import { executeTask, refineResult } from './ai/executor';
import type { Task } from './types';

export default function App() {
  const {
    tasks,
    projects,
    executionState,
    executionQueue,
    showTaskInput,
    loadAll,
    addTask,
    updateTask,
    startExecution,
    setStep,
    setResult,
    setExecutionError,
    clearExecution,
    advanceQueue,
    clearQueue,
    setShowTaskInput,
  } = useStore();

  useEffect(() => {
    loadAll();
  }, []);

  // ── Manual execution (single task, user clicks "実行") ──────────────────────
  const handleExecute = async (task: Task) => {
    startExecution(task.id);
    await updateTask(task.id, { status: 'in_progress' });

    const memory = projects.find((p) => p.projectId === task.projectId);

    try {
      const result = await executeTask(task, memory, (role, status) => {
        setStep(role, status);
      });
      setResult(result);
      await updateTask(task.id, { executionResult: result });
    } catch (e) {
      setExecutionError(e instanceof Error ? e.message : '実行中にエラーが発生しました');
    }
  };

  const handleApprove = async () => {
    if (!executionState.activeTaskId) return;
    await updateTask(executionState.activeTaskId, { status: 'done' });
    clearExecution();
  };

  const handleRefinement = async (request: string) => {
    if (!executionState.result || !executionState.activeTaskId) return;
    startExecution(executionState.activeTaskId);
    try {
      const task = tasks.find((t) => t.id === executionState.activeTaskId);
      if (!task) return;
      setStep('executor', 'running');
      const refined = await refineResult(task, executionState.result, request);
      setStep('executor', 'done');
      setResult(refined);
      await updateTask(executionState.activeTaskId, { executionResult: refined });
    } catch (e) {
      setExecutionError(e instanceof Error ? e.message : '修正中にエラーが発生しました');
    }
  };

  // ── Auto execution (queue-driven, no manual approval) ──────────────────────
  const autoExecutingRef = useRef(false);

  const handleAutoExecute = async (task: Task) => {
    startExecution(task.id);
    await updateTask(task.id, { status: 'in_progress' });

    const memory = projects.find((p) => p.projectId === task.projectId);

    try {
      const result = await executeTask(task, memory, (role, status) => {
        setStep(role, status);
      });
      setResult(result);
      await updateTask(task.id, { executionResult: result, status: 'done' });
      // Advance queue first, then clear execution to trigger next task
      advanceQueue();
      clearExecution();
    } catch (e) {
      setExecutionError(e instanceof Error ? e.message : '実行中にエラーが発生しました');
      clearQueue();
    } finally {
      autoExecutingRef.current = false;
    }
  };

  useEffect(() => {
    if (!executionQueue?.isRunning) return;
    if (executionState.activeTaskId !== null) return;
    if (autoExecutingRef.current) return;

    const { taskIds, currentIndex } = executionQueue;
    if (currentIndex >= taskIds.length) return;

    const nextTask = tasks.find((t) => t.id === taskIds[currentIndex]);
    if (!nextTask) return;

    autoExecutingRef.current = true;
    handleAutoExecute(nextTask);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionQueue, executionState.activeTaskId, tasks]);

  // Task selected from dashboard for result viewing
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const isExecuting = executionState.activeTaskId !== null;
  const hasResult = executionState.result !== null;
  const showAIPanel = isExecuting && !hasResult;
  const activeTask = executionState.activeTaskId
    ? tasks.find((t) => t.id === executionState.activeTaskId)
    : null;
  const isQueueMode = executionQueue?.isRunning === true;
  // Queue has completed (not running, but taskIds still present)
  const queueCompleted =
    executionQueue !== null &&
    !executionQueue.isRunning &&
    executionQueue.taskIds.length > 0;

  const showRightPanel =
    showAIPanel || hasResult || isQueueMode || queueCompleted ||
    (viewingTask !== null && viewingTask.executionResult !== null);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header onNewTask={() => setShowTaskInput(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar projects={projects} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-6 py-5 flex gap-5">
          {/* Dashboard */}
          <div className="flex-1 min-w-0">
            <ExecutiveDashboard
              tasks={tasks}
              onExecute={handleExecute}
              executingTaskId={executionState.activeTaskId}
              onViewResult={(task) => {
                clearExecution();
                clearQueue();
                setViewingTask(task);
              }}
            />
          </div>

          {/* Execution panel (right side) */}
          <AnimatePresence>
            {showRightPanel && (
              <motion.div
                className="w-96 flex-shrink-0 space-y-4"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.3 }}
              >
                {/* Queue progress bar (running) */}
                {isQueueMode && executionQueue && (
                  <div className="bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader size={13} className="text-indigo-500" />
                      </motion.div>
                      <span className="text-sm font-semibold text-indigo-700">
                        自動実行中 ({Math.min(executionQueue.currentIndex + 1, executionQueue.taskIds.length)}/{executionQueue.taskIds.length})
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5">
                      <motion.div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(executionQueue.currentIndex / executionQueue.taskIds.length) * 100}%`,
                        }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>
                )}

                {/* Task title (during execution) */}
                {activeTask && (
                  <div className="text-sm font-semibold text-slate-600 px-1">
                    {activeTask.title}
                  </div>
                )}

                {/* AI Status */}
                {(showAIPanel || hasResult) && (
                  <AIStatusDisplay
                    steps={executionState.steps}
                    error={executionState.error}
                  />
                )}

                {/* Single-task result panels (manual execution, not queue mode) */}
                {hasResult && executionState.result && !isQueueMode && !queueCompleted && (
                  <>
                    {executionState.result.type === 'email' && executionState.result.email && (
                      <EmailPanel
                        email={executionState.result.email}
                        onRefinement={handleRefinement}
                        onApprove={handleApprove}
                        isRefining={isExecuting && !hasResult}
                      />
                    )}
                    {executionState.result.type === 'coding' && executionState.result.coding && (
                      <CodingPanel
                        coding={executionState.result.coding}
                        onApprove={handleApprove}
                      />
                    )}
                    {executionState.result.type === 'research' && executionState.result.research && (
                      <ResearchPanel
                        research={executionState.result.research}
                        onApprove={handleApprove}
                      />
                    )}
                    {executionState.result.type === 'document' && executionState.result.document && (
                      <DocumentPanel
                        document={executionState.result.document}
                        onRefinement={handleRefinement}
                        onApprove={handleApprove}
                        isRefining={isExecuting && !hasResult}
                      />
                    )}
                    {executionState.result.type === 'schedule' && executionState.result.schedule && (
                      <SchedulePanel
                        schedule={executionState.result.schedule}
                        onApprove={handleApprove}
                      />
                    )}
                    <button
                      className="text-xs text-slate-400 hover:text-slate-600 w-full text-center py-1"
                      onClick={clearExecution}
                    >
                      閉じる
                    </button>
                  </>
                )}

                {/* Project results panel (after queue completes) */}
                {queueCompleted && !isQueueMode && executionQueue && (
                  <ProjectResultsPanel
                    tasks={tasks.filter((t) => executionQueue.taskIds.includes(t.id))}
                    projectName={
                      tasks.find((t) => executionQueue.taskIds.includes(t.id))?.projectId ?? ''
                    }
                    onClose={() => {
                      clearQueue();
                      clearExecution();
                    }}
                  />
                )}

                {/* Viewing a completed task's result from dashboard */}
                {viewingTask?.executionResult && !isQueueMode && !queueCompleted && !hasResult && (
                  <>
                    <div className="text-sm font-semibold text-slate-600 px-1">{viewingTask.title}</div>
                    {viewingTask.executionResult.type === 'email' && viewingTask.executionResult.email && (
                      <EmailPanel
                        email={viewingTask.executionResult.email}
                        onRefinement={() => {}}
                        onApprove={() => setViewingTask(null)}
                        isRefining={false}
                      />
                    )}
                    {viewingTask.executionResult.type === 'coding' && viewingTask.executionResult.coding && (
                      <CodingPanel
                        coding={viewingTask.executionResult.coding}
                        onApprove={() => setViewingTask(null)}
                      />
                    )}
                    {viewingTask.executionResult.type === 'research' && viewingTask.executionResult.research && (
                      <ResearchPanel
                        research={viewingTask.executionResult.research}
                        onApprove={() => setViewingTask(null)}
                      />
                    )}
                    {viewingTask.executionResult.type === 'document' && viewingTask.executionResult.document && (
                      <DocumentPanel
                        document={viewingTask.executionResult.document}
                        onRefinement={() => {}}
                        onApprove={() => setViewingTask(null)}
                        isRefining={false}
                      />
                    )}
                    {viewingTask.executionResult.type === 'schedule' && viewingTask.executionResult.schedule && (
                      <SchedulePanel
                        schedule={viewingTask.executionResult.schedule}
                        onApprove={() => setViewingTask(null)}
                      />
                    )}
                    <button
                      className="text-xs text-slate-400 hover:text-slate-600 w-full text-center py-1"
                      onClick={() => setViewingTask(null)}
                    >
                      閉じる
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Task input modal */}
      <AnimatePresence>
        {showTaskInput && (
          <TaskInput
            onAdd={addTask}
            onClose={() => setShowTaskInput(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
