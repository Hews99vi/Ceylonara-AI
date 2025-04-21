@echo off
echo Starting disease detection with image: %1
"C:\Users\user\anaconda3\envs\tf_env\python.exe" "%~dp0test_model.py" %1
exit /b %ERRORLEVEL% 