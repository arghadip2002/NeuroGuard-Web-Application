# backend/app/inference.py
import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
from pathlib import Path
from .model import create_detection_model


class InferenceEngine:
    def __init__(self, model_path: str):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.model_path = model_path
        
        # Class mapping
        self.class_map = {
            0: 'glioma',
            1: 'meningioma',
            2: 'pituitary',
            3: 'notumor'
        }
        
        # Preprocessing transforms
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                               [0.229, 0.224, 0.225])
        ])
        
        self._load_model()
    
    def _load_model(self):
        """Load the PyTorch model"""
        try:
            self.model = create_detection_model(num_classes=4)
            self.model.load_state_dict(
                torch.load(self.model_path, map_location=self.device)
            )
            self.model.to(self.device)
            self.model.eval()
            print(f"✅ Model loaded successfully on {self.device}")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            raise
    
    def predict(self, image_path: str) -> dict:
        """
        Run inference on an image
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary with prediction results
        """
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Run inference
            with torch.no_grad():
                output = self.model(input_tensor)
            
            # Get probabilities and prediction
            probabilities = F.softmax(output, dim=1)
            confidence, predicted_index = torch.max(probabilities, 1)
            
            predicted_class = self.class_map[predicted_index.item()]
            
            return {
                "success": True,
                "predicted_class": predicted_class,
                "confidence": float(confidence.item()),
                "all_probabilities": {
                    self.class_map[i]: float(probabilities[0][i].item())
                    for i in range(len(self.class_map))
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }