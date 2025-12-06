# backend/app/model.py
import torch
import torch.nn as nn


class ResidualInceptionBlock(nn.Module):
    def __init__(self, in_channels, out_channels, stride=1):
        super(ResidualInceptionBlock, self).__init__()
        # Branch 1
        self.branch1 = nn.Conv2d(in_channels, out_channels // 4, kernel_size=1, stride=stride)

        # Branch 2
        self.branch2 = nn.Sequential(
            nn.Conv2d(in_channels, out_channels // 4, kernel_size=1, stride=stride),
            nn.BatchNorm2d(out_channels // 4),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels // 4, out_channels // 4, kernel_size=3, stride=1, padding=1)
        )

        # Branch 3
        self.branch3 = nn.Sequential(
            nn.Conv2d(in_channels, out_channels // 4, kernel_size=1, stride=stride),
            nn.BatchNorm2d(out_channels // 4),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels // 4, out_channels // 4, kernel_size=5, stride=1, padding=2)
        )

        # Branch 4 (Pooling)
        self.branch_pool = nn.Sequential(
            nn.MaxPool2d(kernel_size=3, stride=stride, padding=1),
            nn.Conv2d(in_channels, out_channels // 4, kernel_size=1, stride=1, padding=0)
        )

        # Batch Norm and Activation
        self.bn = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)

        # Shortcut Connection
        self.shortcut = nn.Sequential()
        if in_channels != out_channels or stride != 1:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride),
                nn.BatchNorm2d(out_channels)
            )

    def forward(self, x):
        branch1 = self.branch1(x)
        branch2 = self.branch2(x)
        branch3 = self.branch3(x)
        branch4 = self.branch_pool(x)
        outputs = torch.cat([branch1, branch2, branch3, branch4], 1)
        outputs = self.bn(outputs)
        residual = self.shortcut(x)
        outputs += residual
        outputs = self.relu(outputs)
        return outputs


def make_layer(block, in_channels, out_channels, num_blocks, stride=1):
    layers = []
    layers.append(block(in_channels, out_channels, stride=stride))
    in_channels = out_channels
    for _ in range(1, num_blocks):
        layers.append(block(in_channels, out_channels, stride=1))
    return nn.Sequential(*layers)


class DeeperDetectionModel(nn.Module):
    def __init__(self, num_classes=4):
        super(DeeperDetectionModel, self).__init__()
        self.module1 = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        )
        self.layer1 = make_layer(ResidualInceptionBlock, 64, 256, num_blocks=3, stride=1)
        self.layer2 = make_layer(ResidualInceptionBlock, 256, 512, num_blocks=4, stride=2)
        self.layer3 = make_layer(ResidualInceptionBlock, 512, 1024, num_blocks=6, stride=2)
        self.layer4 = make_layer(ResidualInceptionBlock, 1024, 2048, num_blocks=3, stride=2)
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(2048, num_classes)

    def forward(self, x):
        x = self.module1(x)
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        x = self.avgpool(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        return x


def create_detection_model(num_classes=4):
    """Factory function to create the model"""
    model = DeeperDetectionModel(num_classes=num_classes)
    return model